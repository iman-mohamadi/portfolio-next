import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CYCLE_FPS, FRAME_H, FRAME_W, drawSprite } from './runnerSprite';

interface PixelRunnerProps {
  /** Sprite pixel size in CSS px. Height works out to 14x this. */
  scale?: number;
  className?: string;
}

/**
 * The sprite running in place, for the footer wordmark. No terrain and no
 * travel — in the reference it stays parked against the wordmark and only the
 * legs cycle, so the eye reads it as a mark rather than something crossing
 * the page.
 */
export const PixelRunner: React.FC<PixelRunnerProps> = ({ scale = 4, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = FRAME_W * scale;
    const h = FRAME_H * scale;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const paint = (frame: number) => {
      ctx.clearRect(0, 0, w, h);
      // currentColor, so the sprite tracks the wordmark through theme changes.
      ctx.fillStyle = getComputedStyle(canvas).color;
      drawSprite(ctx, frame, 0, h, scale);
    };

    if (reduced) {
      paint(0);
      return;
    }

    let raf = 0;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      paint(Math.floor(((now - start) / 1000) * CYCLE_FPS));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [scale, reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
};
