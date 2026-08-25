import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

const LINES = ['If it only works', 'in the demo,', "it doesn't work"];

/**
 * A single line set as large as the frame allows, arriving behind the ink
 * curtain that ScrollBackdrop drives across this section. The type stays ink
 * throughout rather than inverting — it is briefly swallowed by the curtain
 * and then revealed as the ground returns to paper, which is the whole point
 * of the beat.
 */
export const QuoteSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.quote-line', {
        yPercent: 104,
        duration: 1.1,
        ease: 'arch',
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 55%', once: true },
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="quote"
      aria-label="Working principle"
      className="relative z-20 min-h-[170svh] px-6 md:px-10"
    >
      {/* Taller than the viewport, with the type held sticky inside it. The
          curtain needs a run of scroll to rise and lift, and both windows have
          to finish before the contact wipe starts — at exactly one viewport
          they collided. Sticky keeps the quote on screen for that whole run
          instead of it scrolling past behind the curtain. */}
      <div className="sticky top-0 h-[100svh] flex items-center">
        <blockquote className="w-full">
          <p className="display text-ink text-[clamp(2.25rem,8.6vw,8rem)] leading-[0.86] text-center">
            {LINES.map((line, i) => (
              <span key={line} className="split-line-mask block">
                <span className="quote-line block">
                  {i === 0 ? `“${line}` : line}
                  {i === LINES.length - 1 ? '”' : ''}
                </span>
              </span>
            ))}
          </p>
        </blockquote>
      </div>
    </section>
  );
};
