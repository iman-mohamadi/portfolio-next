import React, { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { VelocityMarquee } from './motion/VelocityMarquee';
import { useReducedMotion } from '../hooks/useReducedMotion';

const STATEMENT =
  'Most sites are decorated. I would rather they were engineered — load-bearing type, honest motion, and a rendering budget spent where the eye actually lands.';

const MARQUEE_ITEMS = [
  'DESIGN SYSTEMS',
  'WEBGL / GLSL',
  'RENDER PIPELINES',
  'MOTION ARCHITECTURE',
  'PERFORMANCE BUDGETS',
  'DESIGN ENGINEERING',
];

export const ManifestoSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const statementRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (!statementRef.current || reduced) return;

      let split: SplitText | null = null;
      let cancelled = false;

      document.fonts.ready.then(() => {
        if (cancelled || !statementRef.current) return;

        split = SplitText.create(statementRef.current, { type: 'words', wordsClass: 'stmt-word' });
        statementRef.current.classList.remove('reveal-pending');

        // Words brighten in sequence as the section crosses the viewport — the
        // reader's eye is pulled through the sentence at scroll speed.
        gsap.fromTo(
          split.words,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.4,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 72%',
              end: 'bottom 62%',
              scrub: 0.8,
            },
          }
        );
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      aria-label="Approach"
      className="relative z-20 bg-paper border-t border-rule py-24 md:py-40"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex items-center gap-4 mb-12 md:mb-20">
          <span className="label text-ink-faint">(01)</span>
          <span className="h-px flex-1 bg-rule" />
          <span className="label text-spot">Approach</span>
        </div>

        <p
          ref={statementRef}
          className={`font-display font-semibold text-display-md text-ink max-w-5xl text-balance ${
            reduced ? '' : 'reveal-pending'
          }`}
        >
          {STATEMENT}
        </p>
      </div>

      {/* Velocity band */}
      <div className="mt-20 md:mt-32 py-6 border-y border-rule bg-paper-dim/40">
        <VelocityMarquee
          items={MARQUEE_ITEMS}
          baseSpeed={55}
          className="font-display font-bold text-[clamp(1.75rem,5vw,4rem)] tracking-tight text-ink/25"
        />
      </div>
    </section>
  );
};
