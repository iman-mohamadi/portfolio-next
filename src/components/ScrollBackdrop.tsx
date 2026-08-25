import React, { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { useTheme } from '../hooks/useTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

type ColorKey = 'paper' | 'ink' | 'spot';

interface Boundary {
  trigger: string;
  from: ColorKey;
  to: ColorKey;
  /** Override the default window. Must stay in scroll order across the list. */
  start?: string;
  end?: string;
}

// Scroll order of the page: paper (hero + statement) → spot (about/tools) →
// paper (work) → an ink curtain across the quote → spot (contact + footer).
// Each entry is the section whose arrival drives that handoff, and they must
// stay in scroll order — `settle()` below resolves the current ground by
// taking the last boundary that has started.
const BOUNDARIES: Boundary[] = [
  { trigger: '#about', from: 'paper', to: 'spot' },
  { trigger: '#work', from: 'spot', to: 'paper' },
  // The quote arrives behind an ink curtain that then lifts, so the ground
  // flashes to the opposite of the ground between two same-coloured sections.
  //
  // Both windows start only once the quote's top has reached the top of the
  // viewport — i.e. once Work has fully left it. Starting at 'top 88%' meant
  // the curtain climbed while the Work reel was still on screen, and since
  // Work's type is `ink` and the curtain IS `ink`, its text vanished into it:
  // white-on-white in dark mode, black-on-black in light. The quote is sized
  // to give both windows room to finish before the contact wipe begins.
  // The gap between these two is where the quote's type actually lives: the
  // ground is settled ink there, so one colour can contrast with the whole
  // screen. During a wipe the viewport is genuinely two colours and no single
  // text colour works, so the quote fades out across both windows.
  { trigger: '#quote', from: 'paper', to: 'ink', start: 'top top', end: 'top -22%' },
  { trigger: '#quote', from: 'ink', to: 'paper', start: 'top -75%', end: 'top -100%' },
  { trigger: '#contact', from: 'paper', to: 'spot' },
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

      // The legible foreground for each ground. Published as `--on-ground` so
      // type sitting over a changing ground can follow it — hardcoding the ink
      // token meant the quote vanished the moment the curtain became ink.
      const foreground: Record<ColorKey, string> = {
        paper: palette.ink,
        ink: palette.paper,
        spot: styles.getPropertyValue('--color-on-spot').trim(),
      };
      const setForeground = (key: ColorKey) => {
        document.documentElement.style.setProperty('--on-ground', foreground[key]);
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
      setForeground('paper');

      const triggers = BOUNDARIES.map(({ trigger, from, to, start, end }) =>
        ScrollTrigger.create({
          trigger,
          // Deliberately late and short. Starting at 'top bottom' meant the
          // wipe began the instant the outgoing section started moving — the
          // blocks climbed over a hero that was still full-frame. Waiting
          // until the incoming section is most of the way up the viewport
          // keeps the wipe a discrete sweep between two settled states.
          start: start ?? 'top 70%',
          end: end ?? 'top 15%',
          // Measured last, after any pin has inserted its spacer and settled
          // the real document positions these boundaries depend on.
          refreshPriority: -1,
          onUpdate: (self) => {
            const fill = reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress;
            setBase(palette[from]);
            setColumns(palette[to]);
            setHeights(fill);
            // A single crisp flip at the halfway point rather than a blend:
            // the columns are hard-edged, so a fading foreground would read as
            // a smear against them.
            setForeground(fill > 0.5 ? to : from);
          },
          onLeave: () => {
            setBase(palette[to]);
            setHeights(0);
            setForeground(to);
          },
          onLeaveBack: () => {
            setBase(palette[from]);
            setHeights(0);
            setForeground(from);
          },
        })
      );

      // Settle to the correct ground for wherever the page already is — a
      // reload mid-page, or this effect re-running after a theme toggle.
      // Boundaries are in scroll order, so the last one that has started wins.
      const settle = () => {
        let base = palette.paper;
        let baseKey: ColorKey = 'paper';
        let active = -1;
        triggers.forEach((st, i) => {
          if (st.progress <= 0) return;
          if (st.progress >= 1) {
            baseKey = BOUNDARIES[i].to;
            base = palette[baseKey];
            active = -1;
          } else {
            active = i;
          }
        });

        if (active >= 0) {
          const { from, to } = BOUNDARIES[active];
          const fill = triggers[active].progress;
          setBase(palette[from]);
          setColumns(palette[to]);
          setHeights(fill);
          setForeground(fill > 0.5 ? to : from);
        } else {
          setBase(base);
          setHeights(0);
          setForeground(baseKey);
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
