import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Four-frame run cycle, authored as bitmaps so the shapes are legible in the
 * source. `#` is a filled pixel. Frames alternate contact / passing on each
 * leg, which is the minimum that reads as running rather than sliding.
 */
const FRAMES: string[][] = [
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '..#######...',
    '.########...',
    '##..#####...',
    '....#####...',
    '....####....',
    '...###.##...',
    '..###...##..',
    '.###.....##.',
    '###.......##',
    '##.........#',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '...#####.#..',
    '..######.##.',
    '.#######..#.',
    '...#####....',
    '...#####....',
    '...#####....',
    '...##.###...',
    '..##...###..',
    '.###....###.',
    '###......##.',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '...#######..',
    '...########.',
    '...#####..##',
    '...#####....',
    '....####....',
    '...##.###...',
    '..##...###..',
    '.##.....###.',
    '##.......###',
    '#.........##',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '..#.#####...',
    '.##.######..',
    '.#..#######.',
    '....#####...',
    '....#####...',
    '....#####...',
    '...###.##...',
    '..###...##..',
    '.###....###.',
    '.##......###',
  ],
];

const FRAME_W = 12;
const FRAME_H = 14;

/** Block edge in CSS px. The runner's pixel scale is derived from it. */
const BLOCK = 22;
/** Frames of the run cycle per second. */
const CYCLE_FPS = 10;
/** Runner travel in blocks per second. */
const SPEED = 5.2;

interface PixelPathProps {
  /** Total track width in CSS px — the path spans the whole scroll track. */
  width: number;
  className?: string;
}

/**
 * The block staircase and the sprite that runs along it.
 *
 * One canvas rather than a few hundred divs: the path is redrawn every frame
 * anyway because the runner moves, and at this block size a DOM version would
 * be ~300 elements being laid out on every tick.
 *
 * The runner's baseline is the top of whichever column it is currently over,
 * so it climbs and drops with the terrain instead of floating across it.
 */
export const PixelPath: React.FC<PixelPathProps> = ({ width, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;

    const cols = Math.ceil(width / BLOCK);
    const bandRows = 7;
    const height = bandRows * BLOCK;

    // Deterministic random walk: the terrain must be identical on every
    // remount, or the path visibly reshuffles when the section re-enters.
    const heights: number[] = [];
    let h = 2;
    let seed = 20260824;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < cols; i += 1) {
      // Hold the same height for a run of columns so the result is a
      // staircase with flats to run along, not single-column noise.
      if (i % 3 === 0) {
        const step = rand();
        if (step < 0.36) h += 1;
        else if (step < 0.72) h -= 1;
        h = Math.max(1, Math.min(bandRows - 2, h));
      }
      heights.push(h);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const px = BLOCK / FRAME_W * 0.9;

    const draw = (runnerX: number, frame: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0a';

      for (let i = 0; i < cols; i += 1) {
        const colH = heights[i] * BLOCK;
        ctx.fillRect(i * BLOCK, height - colH, BLOCK + 1, colH);
      }

      // Sit the sprite on the column it is over, clamped to the track.
      const col = Math.max(0, Math.min(cols - 1, Math.floor(runnerX / BLOCK)));
      const groundY = height - heights[col] * BLOCK;
      const bodyH = FRAME_H * px;
      const bitmap = FRAMES[frame % FRAMES.length];

      for (let y = 0; y < FRAME_H; y += 1) {
        const row = bitmap[y];
        for (let x = 0; x < FRAME_W; x += 1) {
          if (row[x] !== '#') continue;
          ctx.fillRect(
            Math.round(runnerX + x * px),
            Math.round(groundY - bodyH + y * px),
            Math.ceil(px),
            Math.ceil(px)
          );
        }
      }
    };

    if (reduced) {
      // Still draw the terrain and place the runner — just never animate it.
      draw(BLOCK * 2, 0);
      return;
    }

    let raf = 0;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      const span = width + FRAME_W * px;
      const x = ((t * SPEED * BLOCK) % span) - FRAME_W * px;
      draw(x, Math.floor(t * CYCLE_FPS));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [width, reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
};
