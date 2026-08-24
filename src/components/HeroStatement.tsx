import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * The second full-height panel of the opening. It carries almost nothing —
 * two short statements pinned to opposite margins — because its real job is
 * to give the 3D object a second viewport of scroll to morph through. The
 * middle of the frame is deliberately empty so the canvas behind shows.
 */
export const HeroStatement: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.statement-line', {
        yPercent: 104,
        duration: 1.05,
        ease: 'arch',
        stagger: 0.07,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true },
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Approach"
      className="relative z-20 min-h-[100svh] flex items-center px-6 md:px-10"
    >
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-8 items-center">
        <h2 className="md:col-span-5 display text-[clamp(1.75rem,4vw,3.4rem)] leading-[0.98] text-ink">
          {['Systems built', 'to survive', 'the second year'].map((line) => (
            <span key={line} className="split-line-mask block">
              <span className="statement-line block">{line}</span>
            </span>
          ))}
        </h2>

        {/* The object occupies this gap — nothing is laid out over it. */}
        <div className="hidden md:block md:col-span-2" aria-hidden="true" />

        <p className="md:col-span-5 display text-[clamp(1.75rem,4vw,3.4rem)] leading-[0.98] text-ink md:text-right">
          {['Interfaces that', 'earn a', 'second look'].map((line) => (
            <span key={line} className="split-line-mask block">
              <span className="statement-line block">{line}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
