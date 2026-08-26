import React, { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';

const SECTIONS = [
  { id: 'hero', label: 'Frame' },
  { id: 'about', label: 'Profile' },
  { id: 'tools', label: 'Studies' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
];

/**
 * The persistent right rail.
 *
 * It is the only element on the site that stays put. Everything else moves,
 * and the composition is asymmetric and bottom-left weighted, so the rail is
 * the light counterweight that stops the whole page listing to one side. It
 * also does real work: a mono readout of where you are in a nine-viewport
 * document, and a way to jump.
 *
 * It parallaxes at 0.15x rather than staying perfectly fixed. A truly fixed
 * element in a scrolling scene reads as pasted onto the glass; a small amount
 * of lag puts it in the same space as the content without competing with it.
 *
 * Active section is tracked with one ScrollTrigger per section rather than by
 * reading scroll position and comparing offsets on every tick — the triggers
 * already know, and recomputing what they know is how a rail like this becomes
 * the thing that costs you 60fps.
 */
export const IndexRail: React.FC = () => {
  const railRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('hero');
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // One trigger per section. `onEnter`/`onEnterBack` between them cover
      // both directions without either fighting the other.
      const triggers = SECTIONS.map(({ id }) =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) setActive(id);
          },
        })
      );

      // Document-wide progress on the hairline.
      const progress = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (progressRef.current) {
            gsap.set(progressRef.current, { scaleY: self.progress });
          }
        },
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const lag = gsap.to(railRef.current, {
          y: () => -window.innerHeight * 0.06,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 1.2 },
        });
        return () => {
          lag.scrollTrigger?.kill();
          lag.kill();
        };
      });

      return () => {
        triggers.forEach((t) => t.kill());
        progress.kill();
        mm.revert();
      };
    },
    { scope: railRef }
  );

  return (
    <div
      ref={railRef}
      className="hidden xl:flex fixed right-10 top-1/2 -translate-y-1/2 z-40 flex-col gap-5 will-change-transform"
    >
      {/* The rule the progress rides. Both take their colour from
          `--on-ground` — the rail is fixed and crosses the orange section, and
          an orange progress bar on an orange ground is invisible. */}
      <div
        className="rail-track absolute -left-5 top-0 bottom-0 w-px overflow-hidden"
        aria-hidden="true"
      >
        <div ref={progressRef} className="rail-progress w-full h-full origin-top scale-y-0" />
      </div>

      <nav aria-label="Section index" className="flex flex-col gap-5">
        {SECTIONS.map(({ id, label }, i) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(`#${id}`)}
              aria-current={isActive ? 'true' : undefined}
              className={`rail-item flex items-center gap-3 text-right ${
                isActive ? 'is-active' : ''
              }`}
              data-cursor="active"
            >
              <span className="rail-tick index-mark tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="rail-tick label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
