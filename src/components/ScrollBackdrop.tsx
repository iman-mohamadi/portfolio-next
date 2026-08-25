import React, { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

type ColorKey = 'paper' | 'ink' | 'spot';

interface Boundary {
  trigger: string;
  from: ColorKey;
  to: ColorKey;
  /** Which edge of the trigger drives the window. Defaults to its top. */
  edge?: 'top' | 'bottom';
  /**
   * Viewport fractions, measured down from the top of the viewport, that the
   * edge crosses over the course of the dissolve. Deliberately late and short,
   * so the dissolve is a discrete sweep between two settled states rather than
   * a slow drizzle. Must stay in scroll order across the list.
   */
  window?: [number, number];
}

const DEFAULT_WINDOW: [number, number] = [0.7, 0.2];

// Scroll order of the page: paper (hero + statement) → spot (about/tools) →
// paper (work + quote) → spot (contact + footer). The quote section paints its
// own ink cell-grid overlay, so the ground simply stays paper underneath it.
// Entries must stay in scroll order — `settle()` below resolves the current
// ground by taking the last boundary that has started.
const BOUNDARIES: Boundary[] = [
  { trigger: '#about', from: 'paper', to: 'spot' },
  { trigger: '#work', from: 'spot', to: 'paper' },
  // Driven by the quote's bottom edge rather than contact's own top. The quote
  // paints a full-screen cell grid of its own that is still dissolving as
  // contact comes up, and two pixel grids dissolving over each other at once
  // reads as noise rather than as one handoff. 0.55 is exactly where the
  // quote's grid finishes, so the two meet instead of overlapping.
  { trigger: '#quote', from: 'paper', to: 'spot', edge: 'bottom', window: [0.55, 0.3] },
];

/** Grid columns, matching the reference's section transition. */
const COLS = 6;

/** Clearance left below a boundary's end, in px, so it never needs the last pixel. */
const END_MARGIN = 24;

/** Shortest a squeezed boundary may get before it stops reading as a sweep. */
const MIN_SPAN = 120;

/**
 * The page's background, and the pixel-cell dissolve that changes it.
 *
 * A fixed layer behind every section carries the ground colour. The handoff
 * between grounds is a grid of large square cells in the incoming colour that
 * pop in one by one as the boundary is scrolled through — lower rows first,
 * with a per-cell scatter, so the new ground assembles as a chunky pixel
 * dissolve rather than a smooth fade or a rising curtain.
 *
 * Cell visibility is written straight to style in the scroll callback rather
 * than held in React state — this runs on every scroll tick, and each cell
 * flips exactly once per crossing, so almost every tick writes nothing.
 */
export const ScrollBackdrop: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<HTMLDivElement[]>([]);
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

      // The legible foreground for each ground, published as `--on-ground` so
      // type sitting over a changing ground can follow it.
      const foreground: Record<ColorKey, string> = {
        paper: palette.ink,
        ink: palette.paper,
        spot: styles.getPropertyValue('--color-on-spot').trim(),
      };
      let lastForeground: ColorKey | null = null;
      const setForeground = (key: ColorKey) => {
        if (key === lastForeground) return;
        lastForeground = key;
        document.documentElement.style.setProperty('--on-ground', foreground[key]);
      };

      // Square cells: the column count fixes the cell edge, rows follow.
      let rows = Math.max(
        1,
        Math.round(window.innerHeight / (window.innerWidth / COLS))
      );

      // Per-cell flip threshold in [0, 1]. Lower rows flip first and each cell
      // carries a jitter, which is what makes the dissolve read as scattered
      // pixels instead of a clean bottom-up sweep. Recomputed on rebuild only,
      // so the pattern is stable while a boundary is being scrubbed.
      let thresholds: number[] = [];
      const seedThresholds = () => {
        thresholds = [];
        for (let r = 0; r < rows; r += 1) {
          const rowBase = rows === 1 ? 0 : (1 - r / (rows - 1)) * 0.62;
          for (let c = 0; c < COLS; c += 1) {
            thresholds.push(
              Math.min(0.96, Math.max(0.02, 0.06 + rowBase + Math.random() * 0.3))
            );
          }
        }
      };

      // Last-written style values, so redundant writes are skipped — they
      // still cost a style recalc even when the value is identical.
      let lastBase = '';
      let lastCellColor = '';
      const lastOn: boolean[] = [];

      const build = () => {
        root.innerHTML = '';
        cellsRef.current = [];
        lastCellColor = '';
        lastOn.length = 0;
        seedThresholds();
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < COLS; c += 1) {
            const cell = document.createElement('div');
            cell.style.cssText = `position:absolute;visibility:hidden;left:${
              (c / COLS) * 100
            }%;top:${(r / rows) * 100}%;width:calc(${100 / COLS}% + 1px);height:calc(${
              100 / rows
            }% + 1px);`;
            root.appendChild(cell);
            cellsRef.current.push(cell);
          }
        }
      };
      build();

      const setBase = (c: string) => {
        if (c === lastBase) return;
        lastBase = c;
        root.style.backgroundColor = c;
      };
      const setCellColor = (c: string) => {
        if (c === lastCellColor) return;
        lastCellColor = c;
        cellsRef.current.forEach((el) => {
          el.style.backgroundColor = c;
        });
      };
      const setFill = (progress: number) => {
        cellsRef.current.forEach((el, i) => {
          const on = progress >= thresholds[i];
          if (lastOn[i] === on) return;
          lastOn[i] = on;
          el.style.visibility = on ? 'visible' : 'hidden';
        });
      };

      setBase(palette.paper);
      setForeground('paper');

      // Absolute scroll offset at which the boundary's driving edge sits
      // `frac` of the way down the viewport. Scroll-invariant, so it is safe to
      // call at any point during a refresh.
      const offsetFor = (b: Boundary, frac: number) => {
        const el = document.querySelector(b.trigger);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const edge = b.edge === 'bottom' ? rect.bottom : rect.top;
        return edge + window.scrollY - window.innerHeight * frac;
      };

      // The window, pulled in so it always finishes at a scroll position that
      // can actually be reached. The last boundary sits near the foot of the
      // document, where its natural window runs off the end — uncorrected, the
      // dissolve never reaches 1, `onLeave` never fires, and the bottom of the
      // page sits permanently stranded mid-dissolve, a patchwork of both
      // grounds instead of a settled one.
      const windowFor = (b: Boundary) => {
        const [open, close] = b.window ?? DEFAULT_WINDOW;
        let start = offsetFor(b, open);
        let end = offsetFor(b, close);
        // Land a hair short of the last scrollable pixel. Smooth scrolling can
        // settle a fraction under the true bottom, and a window that needs that
        // final pixel would strand the last cell or two unflipped.
        const limit = ScrollTrigger.maxScroll(window) - END_MARGIN;
        if (end > limit) {
          // Shorten the window rather than sliding it back: `start` is placed
          // where the previous full-screen overlay finishes clearing, so moving
          // it earlier would put two dissolves on screen at once. A shorter
          // sweep still resolves; an overlapping one just reads as noise.
          end = limit;
          start = Math.min(start, end - MIN_SPAN);
        }
        return { start: Math.max(0, start), end: Math.max(1, end) };
      };

      const triggers = BOUNDARIES.map((b) =>
        ScrollTrigger.create({
          trigger: b.trigger,
          start: () => windowFor(b).start,
          end: () => windowFor(b).end,
          // Measured last, after any pin has inserted its spacer and settled
          // the real document positions these boundaries depend on.
          refreshPriority: -1,
          onUpdate: (self) => {
            const fill = reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress;
            setBase(palette[b.from]);
            setCellColor(palette[b.to]);
            setFill(fill);
            // One crisp flip at the halfway point: the cells are hard-edged,
            // so a fading foreground would read as a smear against them.
            setForeground(fill > 0.5 ? b.to : b.from);
          },
          onLeave: () => {
            setBase(palette[b.to]);
            setFill(0);
            setForeground(b.to);
          },
          onLeaveBack: () => {
            setBase(palette[b.from]);
            setFill(0);
            setForeground(b.from);
          },
        })
      );

      // Settle to the correct ground for wherever the page already is — a
      // reload mid-page, this effect re-running after a rebuild, or a refresh
      // that re-measured the document out from under the last resolved ground.
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
          setCellColor(palette[to]);
          setFill(fill);
          setForeground(fill > 0.5 ? to : from);
        } else {
          setBase(base);
          setFill(0);
          setForeground(baseKey);
        }
      };
      settle();

      // These boundaries are created before the preloader has handed over, so
      // they first measure a document that is still short several sections'
      // worth of content — enough for the last boundary to read as already
      // crossed and paint the hero on the closing ground. Re-resolve after
      // every re-measure. Listening on the global event rather than per-trigger
      // `onRefresh` means this runs once, after all three are current.
      ScrollTrigger.addEventListener('refresh', settle);

      // Rebuilding on resize keeps the cells square. Debounced, because a
      // drag-resize fires this continuously.
      let resizeId = 0;
      const onResize = () => {
        window.clearTimeout(resizeId);
        resizeId = window.setTimeout(() => {
          const nextRows = Math.max(
            1,
            Math.round(window.innerHeight / (window.innerWidth / COLS))
          );
          if (nextRows !== rows) {
            rows = nextRows;
            build();
          }
          settle();
        }, 150);
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.clearTimeout(resizeId);
        window.removeEventListener('resize', onResize);
        ScrollTrigger.removeEventListener('refresh', settle);
        triggers.forEach((st) => st.kill());
      };
    },
    { dependencies: [reduced] }
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
