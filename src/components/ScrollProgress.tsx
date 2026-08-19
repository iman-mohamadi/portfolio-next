import React, { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';

const SECTIONS = [
  { id: 'hero', label: 'Index' },
  { id: 'manifesto', label: 'Approach' },
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'contact', label: 'Contact' },
];

/**
 * Vertical progress rail with section markers. Doubles as navigation, which
 * matters on a page that scrolls sideways in the middle — visitors need a
 * persistent sense of where they are and a way out.
 */
export const ScrollProgress: React.FC = () => {
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState('hero');
  const { scrollTo } = useSmoothScroll();

  useGSAP(() => {
    const quickFill = gsap.quickTo(fillRef.current, 'scaleY', {
      duration: 0.4,
      ease: 'power2.out',
    });

    const progressTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => quickFill(self.progress),
    });

    const sectionTriggers = SECTIONS.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) setActiveId(id);
        },
      })
    );

    return () => {
      progressTrigger.kill();
      sectionTriggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <nav
      ref={railRef}
      aria-label="Section progress"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-5"
    >
      <div className="relative h-40 w-px bg-rule overflow-hidden">
        <div ref={fillRef} className="absolute inset-0 bg-ink origin-top scale-y-0" />
      </div>

      <ul className="flex flex-col items-end gap-3">
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <button
                onClick={() => scrollTo(`#${id}`)}
                aria-current={isActive ? 'true' : undefined}
                className={`group flex items-center gap-2.5 label transition-colors duration-500 ${
                  isActive ? 'text-spot' : 'text-ink-faint hover:text-ink'
                }`}
                data-cursor="active"
              >
                <span
                  className={`transition-all duration-500 ${
                    isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`h-px transition-all duration-500 ${
                    isActive ? 'w-6 bg-spot' : 'w-3 bg-rule group-hover:w-5 group-hover:bg-ink'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
