import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CYCLE_FPS, FRAME_H, FRAME_W, drawSprite } from './runnerSprite';

/** Block edge in CSS px. */
const BLOCK = 26;
/** Total steps in the flight — the staircase spans this many blocks. */
const STEPS = 14;

interface StairProgressProps {
  /** Live scroll progress of the pinned section, 0..1. Read every frame. */
  progressRef: React.MutableRefObject<number>;
  className?: string;
}

/**
 * The section's progress mark: a pixel staircase descending left-to-right,
 * built step by step as the reel is scrolled, with the runner sprite standing
 * on the lowest built step. One canvas, redrawn only while the legs cycle or
 * the progress changes.
 */
export const StairProgress: React.FC<StairProgressProps> = ({
  progressRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Each step advances two blocks right and one block down.
    const w = (STEPS * 2 + 2) * BLOCK;
    const h = (STEPS + FRAME_H / 2) * BLOCK;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const spriteScale = (BLOCK / FRAME_W) * 1.1;

    const draw = (progress: number, frame: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a0a';

      const built = Math.max(1, Math.round(progress * STEPS));
      for (let i = 0; i < built; i += 1) {
        // A flat pair of blocks per step, dropping one block each time.
        ctx.fillRect(i * 2 * BLOCK, (FRAME_H / 2) * BLOCK + i * BLOCK, BLOCK * 2 + 1, BLOCK);
      }

      const tipX = (built - 1) * 2 * BLOCK;
      const tipY = (FRAME_H / 2) * BLOCK + (built - 1) * BLOCK;
      drawSprite(ctx, frame, tipX + BLOCK * 0.2, tipY, spriteScale);
    };

    if (reduced) {
      draw(progressRef.current, 0);
      return;
    }

    let raf = 0;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      draw(progressRef.current, Math.floor(((now - start) / 1000) * CYCLE_FPS));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
};
