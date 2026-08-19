/**
 * Web Audio engine: an ambient pad plus short interface SFX.
 *
 * Everything is synthesised — no audio files, nothing to download. A single
 * AudioContext is created lazily on the first user gesture (browsers refuse to
 * start one otherwise) and reused for the life of the page.
 */

type Sfx = 'hover' | 'click' | 'open' | 'close' | 'success' | 'toggle';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let padGain: GainNode | null = null;
let padNodes: (OscillatorNode | LFO)[] = [];
let enabled = false;

interface LFO {
  stop: () => void;
  disconnect: () => void;
}

const MASTER_LEVEL = 0.34;
const PAD_LEVEL = 0.14;

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;

  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;

  // Gentle ceiling so stacked SFX and the pad can never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 12;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;

  master.connect(limiter);
  limiter.connect(ctx.destination);

  return ctx;
}

/**
 * Ambient pad. Voiced in the low-mids rather than sub-bass — the previous
 * version sat at 55 Hz behind a 220 Hz lowpass, which is inaudible on laptop
 * speakers and read as "the button does nothing".
 */
function startPad() {
  if (!ctx || !master || padGain) return;

  padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  padGain.gain.exponentialRampToValueAtTime(PAD_LEVEL, ctx.currentTime + 3.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  filter.connect(padGain);
  padGain.connect(master);

  // Slow filter sweep so the pad breathes instead of sitting static.
  const sweep = ctx.createOscillator();
  const sweepDepth = ctx.createGain();
  sweep.frequency.value = 0.05;
  sweepDepth.gain.value = 320;
  sweep.connect(sweepDepth);
  sweepDepth.connect(filter.frequency);
  sweep.start();
  padNodes.push(sweep);

  // E minor add9, spread across two octaves.
  const voices = [
    { freq: 82.41, type: 'sine' as const, gain: 0.9 }, // E2
    { freq: 164.81, type: 'triangle' as const, gain: 0.5 }, // E3
    { freq: 196.0, type: 'triangle' as const, gain: 0.34 }, // G3
    { freq: 246.94, type: 'sine' as const, gain: 0.3 }, // B3
    { freq: 369.99, type: 'sine' as const, gain: 0.16 }, // F#4 (the 9th)
  ];

  voices.forEach(({ freq, type, gain }, i) => {
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = type;
    // A few cents of detune per voice keeps the chord from sounding synthetic.
    osc.frequency.value = freq;
    osc.detune.value = (i - 2) * 4;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = gain;

    // Independent slow tremolo per voice → the pad never loops audibly.
    const trem = ctx.createOscillator();
    const tremDepth = ctx.createGain();
    trem.frequency.value = 0.07 + i * 0.023;
    tremDepth.gain.value = gain * 0.32;
    trem.connect(tremDepth);
    tremDepth.connect(voiceGain.gain);
    trem.start();

    osc.connect(voiceGain);
    voiceGain.connect(filter);
    osc.start();

    padNodes.push(osc, trem);
  });
}

function stopPad() {
  if (!ctx || !padGain) return;

  const now = ctx.currentTime;
  const gainNode = padGain;
  const nodes = padNodes;

  padGain = null;
  padNodes = [];

  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.0001), now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  window.setTimeout(() => {
    nodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Already stopped — nothing to do.
      }
    });
    gainNode.disconnect();
  }, 1400);
}

/** Enable or disable all audio. Must be called from a user gesture the first time. */
export function setAudioEnabled(on: boolean) {
  enabled = on;

  if (!on) {
    stopPad();
    return;
  }

  const audio = ensureContext();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume();

  startPad();
  playSfx('toggle');
}

export function isAudioEnabled() {
  return enabled;
}

let lastHover = 0;

/** Fire a short interface sound. No-ops entirely when audio is off. */
export function playSfx(name: Sfx) {
  if (!enabled || !ctx || !master) return;

  // Hover fires from a global listener; without a floor it machine-guns.
  if (name === 'hover') {
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
  }

  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(master);

  const tone = (
    type: OscillatorType,
    from: number,
    to: number,
    duration: number,
    level: number,
    startAt = 0
  ) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t + startAt);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + startAt + duration);

    gain.gain.setValueAtTime(0.0001, t + startAt);
    gain.gain.exponentialRampToValueAtTime(level, t + startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + startAt + duration);

    osc.connect(gain);
    gain.connect(out);
    osc.start(t + startAt);
    osc.stop(t + startAt + duration + 0.05);
  };

  switch (name) {
    case 'hover':
      tone('sine', 2100, 2600, 0.05, 0.05);
      break;
    case 'click':
      tone('triangle', 620, 240, 0.11, 0.16);
      tone('sine', 1400, 900, 0.06, 0.06);
      break;
    case 'open':
      tone('sawtooth', 180, 720, 0.28, 0.07);
      tone('sine', 440, 880, 0.3, 0.05);
      break;
    case 'close':
      tone('sawtooth', 620, 170, 0.24, 0.06);
      break;
    case 'toggle':
      tone('sine', 520, 780, 0.16, 0.12);
      break;
    case 'success':
      // Rising E-major triad.
      [659.25, 830.61, 987.77].forEach((f, i) => tone('sine', f, f, 0.42, 0.11, i * 0.09));
      break;
  }

  // Release the per-SFX bus once the tail has decayed.
  window.setTimeout(() => out.disconnect(), 1200);
}

/** @deprecated Kept for compatibility — prefer setAudioEnabled. */
export const toggleAmbientAudio = setAudioEnabled;
