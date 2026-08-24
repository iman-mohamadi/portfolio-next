import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The four live studies in the Tools track. Each is deliberately small and
 * self-contained — canvas 2D or plain CSS, never a second WebGL context — so
 * the whole section costs nothing next to the hero renderer.
 */

/** 001 — mirrored type with an RGB split, the channels drifting apart. */
export const ChromaWarp: React.FC = () => (
  <div className="chroma-warp absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="chroma-line display text-[clamp(1.5rem,3.4vw,3rem)] leading-none"
        style={{ animationDelay: `${i * -1.4}s` }}
      >
        Shader
      </span>
    ))}
  </div>
);

/** 002 — a stripe mask sweeping over outlined type. */
export const SplitMask: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
    <span className="split-mask display text-center text-[clamp(1.5rem,3.2vw,2.75rem)] leading-[0.95]">
      Open
      <br />
      to
      <br />
      work
    </span>
  </div>
);

const MAZE_WORD = 'REMIX';
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** 003 — letters settling out of a scramble, then re-scrambling. */
export const TextMaze: React.FC = () => {
  const [chars, setChars] = useState<string[]>(() => MAZE_WORD.split(''));
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      // Cycle: scramble for ~1s, hold the word for ~1.4s, repeat.
      const phase = frame % 36;
      if (phase < 14) {
        setChars(
          MAZE_WORD.split('').map((c, i) =>
            phase > 8 + i ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
        );
      } else {
        setChars(MAZE_WORD.split(''));
      }
    }, 70);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        className="display text-spot text-[clamp(1.5rem,3.6vw,3rem)] tracking-[0.22em]"
        aria-label={MAZE_WORD}
      >
        {chars.map((c, i) => (
          // Index keys are correct here: this is a fixed-length character
          // grid where position is the identity, not a reorderable list.
          <span key={i} aria-hidden="true">
            {c}
          </span>
        ))}
      </span>
    </div>
  );
};

/** 004 — a drifting particle cloud that keeps re-forming a soft column. */
export const ParticleCloud: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const COUNT = 220;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: 0.15 + Math.random() * 0.5,
      r: 1 + Math.random() * 2.4,
      a: 0.25 + Math.random() * 0.5,
    }));

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    if (reduced) {
      paint();
      return;
    }

    let raf = 0;
    const loop = () => {
      pts.forEach((p) => {
        p.y -= p.vy;
        // Drift toward the centre column as they rise, so the cloud keeps
        // gathering into a plume instead of dispersing to a flat field.
        p.x += (w / 2 - p.x) * 0.0015;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
      });
      paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
};
