/**
 * Web Audio engine: a looping ambient bed plus sampled interface sounds.
 *
 * Samples rather than oscillators. Buffers are fetched lazily on the first
 * enable — nothing is downloaded for visitors who never turn sound on — and a
 * single AudioContext is created on that same user gesture, since browsers
 * refuse to start one otherwise.
 */

export type Sfx = 'hover' | 'secondaryHover' | 'click' | 'open' | 'close' | 'success' | 'toggle';

const SOURCES: Record<string, string> = {
  ambient: '/audio/ambient-loop.mp3',
  hover: '/audio/hover.wav',
  secondaryHover: '/audio/secondary-hover.wav',
  click: '/audio/click.wav',
  open: '/audio/modal-open.wav',
};

/** Per-sound level and playback rate. Keeps the mix in one place. */
const VOICES: Record<Sfx, { key: string; gain: number; rate?: number }> = {
  hover: { key: 'hover', gain: 0.35 },
  secondaryHover: { key: 'secondaryHover', gain: 0.3 },
  click: { key: 'click', gain: 0.55 },
  open: { key: 'open', gain: 0.5 },
  // Reuse the open sample, pitched down, so closing is recognisably its inverse.
  close: { key: 'open', gain: 0.32, rate: 0.82 },
  success: { key: 'open', gain: 0.5, rate: 1.12 },
  toggle: { key: 'click', gain: 0.4, rate: 1.15 },
};

const MASTER_LEVEL = 0.7;
const AMBIENT_LEVEL = 0.22;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientGain: GainNode | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let enabled = false;

const buffers = new Map<string, AudioBuffer>();
let loadPromise: Promise<void> | null = null;

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;

  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;

  // Ceiling so stacked hovers and the bed can never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;

  master.connect(limiter);
  limiter.connect(ctx.destination);
  return ctx;
}

/** Fetch and decode every sample once. Failures are per-sound, never fatal. */
function loadBuffers(audio: AudioContext): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all(
    Object.entries(SOURCES).map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        buffers.set(key, await audio.decodeAudioData(await res.arrayBuffer()));
      } catch {
        // A missing or undecodable sample simply goes silent.
      }
    })
  ).then(() => undefined);

  return loadPromise;
}

function startAmbient() {
  if (!ctx || !master || ambientSource) return;
  const buffer = buffers.get('ambient');
  if (!buffer) return;

  ambientGain = ctx.createGain();
  ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  ambientGain.gain.exponentialRampToValueAtTime(AMBIENT_LEVEL, ctx.currentTime + 3);
  ambientGain.connect(master);

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = buffer;
  ambientSource.loop = true;
  ambientSource.connect(ambientGain);
  ambientSource.start();
}

function stopAmbient() {
  if (!ctx || !ambientGain || !ambientSource) return;

  const now = ctx.currentTime;
  const gain = ambientGain;
  const source = ambientSource;
  ambientGain = null;
  ambientSource = null;

  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  window.setTimeout(() => {
    try {
      source.stop();
      source.disconnect();
    } catch {
      // Already stopped.
    }
    gain.disconnect();
  }, 1400);
}

/** Enable or disable all audio. Must be called from a user gesture the first time. */
export function setAudioEnabled(on: boolean) {
  enabled = on;

  if (!on) {
    stopAmbient();
    return;
  }

  const audio = ensureContext();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume();

  void loadBuffers(audio).then(() => {
    // The visitor may have toggled off again while the samples were in flight.
    if (!enabled) return;
    startAmbient();
    playSfx('toggle');
  });
}

export function isAudioEnabled() {
  return enabled;
}

let lastHover = 0;

/** Fire an interface sound. No-ops entirely when audio is off. */
export function playSfx(name: Sfx) {
  if (!enabled || !ctx || !master) return;

  // Hover fires from a global listener; without a floor it machine-guns.
  if (name === 'hover' || name === 'secondaryHover') {
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
  }

  const voice = VOICES[name];
  const buffer = buffers.get(voice.key);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (voice.rate) source.playbackRate.value = voice.rate;

  const gain = ctx.createGain();
  gain.gain.value = voice.gain;

  source.connect(gain);
  gain.connect(master);
  source.start();
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
}

/** @deprecated Kept for compatibility — prefer setAudioEnabled. */
export const toggleAmbientAudio = setAudioEnabled;
