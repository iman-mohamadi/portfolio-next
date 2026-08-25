import React, { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { PixelHoverBurst } from './motion/PixelHoverBurst';
import { useReducedMotion } from '../hooks/useReducedMotion';

const LINES = ['If it only works', 'in the demo,', "it doesn't work"];

/** Cell grid covering the quote, matching the reference's 18 x 12. */
const COLS = 18;
const ROWS = 12;

/**
 * An inverted panel that assembles out of pixel cells, holds while the quote
 * is read, then dissolves away — all scrubbed by scroll.
 *
 * The type is only ever shown against the fully assembled panel: it fades in
 * once coverage is complete and out before the first cell leaves. Mid-dissolve
 * the viewport is a patchwork of two grounds and no text colour survives that,
 * so nothing is asked to.
 */
export const QuoteSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const grid = gridRef.current;
      const quote = quoteRef.current;
      if (!grid || !quote) return;

      const cells = Array.from(grid.children) as HTMLElement[];
      const thresholds = cells.map(() => 0.05 + Math.random() * 0.9);
      const lastOn: boolean[] = [];
      const setFill = (coverage: number) => {
        cells.forEach((el, i) => {
          const on = coverage >= thresholds[i];
          if (lastOn[i] === on) return;
          lastOn[i] = on;
          el.style.visibility = on ? 'visible' : 'hidden';
        });
      };
      setFill(0);

      let lastShown: boolean | null = null;
      const setQuote = (shown: boolean) => {
        if (shown === lastShown) return;
        lastShown = shown;
        quote.style.opacity = shown ? '1' : '0';
      };
      setQuote(false);

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        end: 'bottom 55%',
        refreshPriority: -1,
        onUpdate: (self) => {
          const p = reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress;
          // Assemble over the first third, hold, dissolve over the last third.
          const coverage = p < 0.35 ? p / 0.35 : p > 0.65 ? (1 - p) / 0.35 : 1;
          setFill(Math.min(1, coverage));
          // Text only on the settled panel, with a hair of margin so it is
          // never caught over a half-built patchwork.
          setQuote(p >= 0.36 && p <= 0.64);
        },
      });

      return () => st.kill();
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="quote"
      aria-label="Working principle"
      className="relative z-20 min-h-[160svh] px-6 md:px-10"
    >
      <div className="pixel-hover-host sticky top-0 h-[100svh] flex items-center overflow-hidden">
        {/* The inverted panel, assembled from ink cells over the ground. */}
        <div ref={gridRef} className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            return (
              <span
                key={i}
                className="absolute bg-ink"
                style={{
                  left: `${(c / COLS) * 100}%`,
                  top: `${(r / ROWS) * 100}%`,
                  width: `calc(${100 / COLS}% + 1px)`,
                  height: `calc(${100 / ROWS}% + 1px)`,
                }}
              />
            );
          })}
        </div>

        {/* Hover burst over the settled panel, matching the reference grid. */}
        <PixelHoverBurst cols={18} rows={12} />

        <blockquote
          ref={quoteRef}
          className="relative w-full transition-opacity duration-300"
          style={{ opacity: 0 }}
        >
          <p className="display text-paper text-[clamp(2.25rem,8.6vw,8rem)] leading-[0.86] text-center">
            {LINES.map((line, i) => (
              <span key={line} className="block">
                {i === 0 ? `“${line}` : line}
                {i === LINES.length - 1 ? '”' : ''}
              </span>
            ))}
          </p>
        </blockquote>
      </div>
    </section>
  );
};
