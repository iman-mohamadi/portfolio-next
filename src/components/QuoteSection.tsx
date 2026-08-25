import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

const LINES = ['If it only works', 'in the demo,', "it doesn't work"];

/**
 * A single line set as large as the frame allows, on the ink ground the block
 * wipe brings in for this section.
 *
 * The type is deliberately absent while either curtain is moving. Mid-wipe the
 * viewport is split between two grounds, so no single text colour contrasts
 * with all of it — the previous version left the lower half of the quote
 * swallowed by the rising blocks. It fades in only once the ground has settled
 * to ink, holds for the whole readable stretch, and fades out before the
 * curtain lifts. `text-on-ground` then resolves to the correct foreground for
 * whichever ground is settled, in either theme.
 */
export const QuoteSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      // Window matches the gap between the two curtain boundaries in
      // ScrollBackdrop: in by the time the first finishes, out before the
      // second starts.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top -14%',
            end: 'top -78%',
            scrub: true,
          },
        })
        .fromTo(
          '.quote-body',
          { opacity: 0, yPercent: 6 },
          { opacity: 1, yPercent: 0, duration: 0.13, ease: 'none' }
        )
        .to('.quote-body', { opacity: 1, duration: 0.74, ease: 'none' })
        .to('.quote-body', { opacity: 0, yPercent: -6, duration: 0.13, ease: 'none' });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="quote"
      aria-label="Working principle"
      className="relative z-20 min-h-[200svh] px-6 md:px-10"
    >
      {/* Tall, with the type held sticky inside. The curtain needs a run of
          scroll to rise, hold and lift, and both windows have to finish before
          the contact wipe starts — at one viewport they collided. */}
      <div className="sticky top-0 h-[100svh] flex items-center">
        <blockquote className="w-full">
          <p className="quote-body display text-on-ground text-[clamp(2.25rem,8.6vw,8rem)] leading-[0.86] text-center">
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
