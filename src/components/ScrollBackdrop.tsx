import React, { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { useTheme } from '../hooks/useTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

type ColorKey = 'paper' | 'ink' | 'spot';

interface Boundary {
  trigger: string;
  from: ColorKey;
  to: ColorKey;
}

// Scroll order of the page: paper (hero) → spot (about/tools) → paper (work)
// → spot (contact) → paper (footer). Each entry is the section whose arrival
// drives the next handoff.
const BOUNDARIES: Boundary[] = [
  { trigger: '#about', from: 'paper', to: 'spot' },
  { trigger: '#work', from: 'spot', to: 'paper' },
  { trigger: '#contact', from: 'paper', to: 'spot' },
  { trigger: 'footer', from: 'spot', to: 'paper' },
];

/** Widest a single block may get. Below this the grid stops subdividing. */
const MAX_BLOCK = 130;
const MIN_COLS = 8;

/**
 * Spread of the per-column head start. Small on purpose: the reference reads
 * as one advancing edge with a jagged crest, so neighbouring columns have to
 * stay within a block or two of each other. Widen this and the columns
 * separate into unrelated vertical stripes instead of a skyline.
 */
const OFFSET_SPREAD = 0.3;

/**
 * The page's background, and the block wipe that changes it.
 *
 * A fixed layer behind every section carries the ground colour, so sections
 * themselves paint nothing (`.bleed-spot` has no background of its own). The
 * handoff between grounds is not a fade: it is a grid of squares, one stack
 * per column, that fills from the bottom as the boundary is scrolled through.
 * Each column carries a randomised head start and each stack height is snapped
 * to whole blocks, which is what produces the stepped skyline rather than a
 * set of smooth bars.
 *
 * Column heights are written straight to style in the scroll callback rather
 * than held in React state — this runs on every scroll tick, and a re-render
 * per frame for sixteen divs would be pure waste.
 */
export const ScrollBackdrop: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement[]>([]);
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const styles = getComputedStyle(document.documentElement);
      const palette: Record<ColorKey, string> = {
        paper: styles.getPropertyValue('--color-paper').trim(),
        ink: styles.getPropertyValue('--color-ink').trim(),
        spot: styles.getPropertyValue('--color-spot').trim(),
      };

      // Square blocks: the column count sets the block width, and the row
      // count follows from it so each block is as tall as it is wide.
      let cols = Math.max(MIN_COLS, Math.ceil(window.innerWidth / MAX_BLOCK));
      let rows = Math.max(1, Math.ceil(window.innerHeight / (window.innerWidth / cols)));

      // Per-column head start. Stable across a session so the skyline doesn't
      // reshuffle every time a boundary is re-crossed.
      const offsets: number[] = [];
      const seedOffsets = () => {
        offsets.length = 0;
        for (let i = 0; i < cols; i += 1) offsets.push(Math.random() * OFFSET_SPREAD);
      };
      seedOffsets();

      const build = () => {
        root.innerHTML = '';
        colsRef.current = [];
        for (let i = 0; i < cols; i += 1) {
          const wrap = document.createElement('div');
          wrap.style.cssText =
            'position:absolute;bottom:0;top:0;display:flex;flex-direction:column;justify-content:flex-end;';
          wrap.style.left = `${(i / cols) * 100}%`;
          // Overlap by a hair: sub-pixel gaps between columns show the layer
          // behind as hairlines at some widths.
          wrap.style.width = `calc(${100 / cols}% + 1px)`;

          const fill = document.createElement('div');
          fill.style.cssText = 'width:100%;height:0;';
          wrap.appendChild(fill);
          root.appendChild(wrap);
          colsRef.current.push(fill);
        }
      };
      build();

      const setBase = (c: string) => {
        root.style.backgroundColor = c;
      };
      const setColumns = (c: string) => {
        colsRef.current.forEach((el) => {
          el.style.backgroundColor = c;
        });
      };
      const setHeights = (fraction: number) => {
        colsRef.current.forEach((el, i) => {
          const span = 1 - Math.max(...offsets);
          const local = Math.min(1, Math.max(0, (fraction - offsets[i]) / span));
          // Snap to whole blocks — the quantisation is the whole effect.
          el.style.height = `${(Math.ceil(local * rows) / rows) * 100}%`;
        });
      };

      setBase(palette.paper);
      setColumns(palette.spot);

      const triggers = BOUNDARIES.map(({ trigger, from, to }) =>
        ScrollTrigger.create({
          trigger,
          // Deliberately late and short. Starting at 'top bottom' meant the
          // wipe began the instant the outgoing section started moving — the
          // blocks climbed over a hero that was still full-frame. Waiting
          // until the incoming section is most of the way up the viewport
          // keeps the wipe a discrete sweep between two settled states.
          start: 'top 70%',
          end: 'top 15%',
          onUpdate: (self) => {
            setBase(palette[from]);
            setColumns(palette[to]);
            setHeights(reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress);
          },
          onLeave: () => {
            setBase(palette[to]);
            setHeights(0);
          },
          onLeaveBack: () => {
            setBase(palette[from]);
            setHeights(0);
          },
        })
      );

      // Settle to the correct ground for wherever the page already is — a
      // reload mid-page, or this effect re-running after a theme toggle.
      // Boundaries are in scroll order, so the last one that has started wins.
      const settle = () => {
        let base = palette.paper;
        let active = -1;
        triggers.forEach((st, i) => {
          if (st.progress <= 0) return;
          if (st.progress >= 1) {
            base = palette[BOUNDARIES[i].to];
            active = -1;
          } else {
            active = i;
          }
        });

        if (active >= 0) {
          setBase(palette[BOUNDARIES[active].from]);
          setColumns(palette[BOUNDARIES[active].to]);
          setHeights(triggers[active].progress);
        } else {
          setBase(base);
          setHeights(0);
        }
      };
      settle();

      // Rebuilding on resize keeps the blocks square. Debounced, because a
      // drag-resize fires this continuously.
      let resizeId = 0;
      const onResize = () => {
        window.clearTimeout(resizeId);
        resizeId = window.setTimeout(() => {
          const nextCols = Math.max(MIN_COLS, Math.ceil(window.innerWidth / MAX_BLOCK));
          rows = Math.max(
            1,
            Math.ceil(window.innerHeight / (window.innerWidth / nextCols))
          );
          if (nextCols !== cols) {
            cols = nextCols;
            seedOffsets();
            build();
          }
          settle();
        }, 150);
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.clearTimeout(resizeId);
        window.removeEventListener('resize', onResize);
        triggers.forEach((st) => st.kill());
      };
    },
    { dependencies: [theme, reduced] }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ backgroundColor: 'var(--color-paper)' }}
    />
  );
};
