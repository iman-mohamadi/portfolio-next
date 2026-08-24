import React, { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useTheme } from '../hooks/useTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

type ColorKey = 'paper' | 'spot';

interface Boundary {
  trigger: string;
  from: ColorKey;
  to: ColorKey;
}

// Scroll order of the page: paper (hero) → spot (about/tools) → paper (work)
// → spot (contact) → paper (footer). Each entry is the section whose arrival
// starts the next handoff.
const BOUNDARIES: Boundary[] = [
  { trigger: '#about', from: 'paper', to: 'spot' },
  { trigger: '#work', from: 'spot', to: 'paper' },
  { trigger: '#contact', from: 'paper', to: 'spot' },
  { trigger: 'footer', from: 'spot', to: 'paper' },
];

/**
 * A single fixed layer painted behind every section, carrying the page's
 * background colour. The sections that would otherwise cut hard from paper to
 * orange (`.bleed-spot` in index.css) render with no background of their own
 * — this is what actually paints — so the colour can blend across the whole
 * viewport as each section's leading edge crosses it, instead of the flip
 * happening exactly at whatever height the boundary lands on screen.
 *
 * Deliberately not a gsap.to()/scrub tween: a scrub tween keeps rendering its
 * clamped start/end value on every scroll tick for as long as it exists, even
 * far outside its own active range, so with four of them layered on the same
 * property the last one created wins regardless of where the page actually
 * is. Plain ScrollTrigger.create + onUpdate only writes while a boundary is
 * actually being crossed, so the writes stay in scroll order.
 */
export const ScrollBackdrop: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const styles = getComputedStyle(document.documentElement);
      const palette: Record<ColorKey, string> = {
        paper: styles.getPropertyValue('--color-paper').trim(),
        spot: styles.getPropertyValue('--color-spot').trim(),
      };

      // Reduced motion still needs the colour to land correctly — it just
      // crosses over a slim band instead of blending across a full viewport
      // height of scroll.
      const start = reduced ? 'top 55%' : 'top bottom';
      const end = reduced ? 'top 45%' : 'top top';

      const triggers = BOUNDARIES.map(({ trigger, from, to }) =>
        ScrollTrigger.create({
          trigger,
          start,
          end,
          onUpdate: (self) => {
            el.style.backgroundColor = gsap.utils.interpolate(
              palette[from],
              palette[to],
              self.progress
            );
          },
          onLeave: () => {
            el.style.backgroundColor = palette[to];
          },
          onLeaveBack: () => {
            el.style.backgroundColor = palette[from];
          },
        })
      );

      // Settle to the right colour for wherever the page is already scrolled
      // to — a reload mid-page, or this effect re-running after a theme
      // toggle — without waiting for a scroll event to fire the callbacks
      // above. Boundaries are in scroll order, so the last one that has
      // actually started is always the correct answer.
      let settled = palette.paper;
      triggers.forEach((st, i) => {
        const { from, to } = BOUNDARIES[i];
        if (st.progress <= 0) return;
        settled =
          st.progress >= 1
            ? palette[to]
            : gsap.utils.interpolate(palette[from], palette[to], st.progress);
      });
      el.style.backgroundColor = settled;

      return () => triggers.forEach((st) => st.kill());
    },
    { dependencies: [theme, reduced] }
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ backgroundColor: 'var(--color-paper)' }}
    />
  );
};
