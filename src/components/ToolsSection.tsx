import React, { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { VelocityMarquee } from './motion/VelocityMarquee';
import { EncryptedText } from './motion/EncryptedText';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ToolGroup {
  index: string;
  title: string;
  note: string;
  items: string[];
}

const GROUPS: ToolGroup[] = [
  {
    index: '01',
    title: 'Build',
    note: 'What the product is actually written in.',
    items: ['TypeScript', 'React 19', 'Vue 3 / Nuxt', 'Next.js', 'Vite', 'Node.js', 'Python'],
  },
  {
    index: '02',
    title: 'Motion',
    note: 'Timing, easing, and everything that moves.',
    items: ['GSAP', 'ScrollTrigger', 'Lenis', 'Motion', 'CSS transforms'],
  },
  {
    index: '03',
    title: 'Graphics',
    note: 'Real-time rendering, written by hand.',
    items: ['Three.js', 'React Three Fiber', 'GLSL', 'Canvas 2D', 'Web Audio'],
  },
  {
    index: '04',
    title: 'Ship',
    note: 'Getting it out and keeping it fast.',
    items: ['Tailwind v4', 'Storybook', 'Vitest', 'Playwright', 'Docker', 'Vercel'],
  },
];

const MARQUEE = [
  'TypeScript',
  'React',
  'Vue',
  'GSAP',
  'Three.js',
  'GLSL',
  'Tailwind',
  'Node',
  'Vite',
  'Nuxt',
  'WebGL',
  'Design systems',
];

/**
 * The second half of the orange block. The same numbered-row language as About,
 * but the rows expand: hovering (or focusing) one lifts its stack of tools into
 * view. A velocity-driven marquee closes the block before the page returns to
 * paper.
 */
export const ToolsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>(GROUPS[0].index);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.tools-line', {
        yPercent: 105,
        duration: 1.1,
        ease: 'arch',
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });

      gsap.from('.tools-row', {
        opacity: 0,
        y: 24,
        duration: 0.85,
        ease: 'arch',
        stagger: 0.07,
        scrollTrigger: { trigger: '.tools-rows', start: 'top 85%', once: true },
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="tools"
      aria-label="Tools"
      className="bleed-spot relative z-20 pt-14 md:pt-20 pb-20 md:pb-24 px-6 md:px-10"
    >
      <div className="flex items-center gap-4 mb-12 md:mb-16">
        <span className="label">[ Tools ]</span>
        <span className="rule-h flex-1" />
        <span className="label">Stack / 2026</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10 items-end mb-16 md:mb-24">
        <h2 className="lg:col-span-7 display text-[clamp(3rem,12vw,11rem)]">
          <span className="split-line-mask block">
            <span className="tools-line block">Tools</span>
          </span>
        </h2>
        <p className="lg:col-span-5 max-w-[30rem] text-sm md:text-base leading-relaxed opacity-80 lg:pb-4">
          No allegiances. I pick whatever gets the thing built and keeps it
          maintainable a year later — then learn it properly rather than
          half-using four alternatives.
        </p>
      </div>

      <div className="tools-rows">
        <ul>
          {GROUPS.map((group) => {
            const isActive = active === group.index;
            return (
              <li
                key={group.index}
                className="tools-row border-t border-[#0a0a0a]/28 last:border-b"
                onMouseEnter={() => setActive(group.index)}
                onFocus={() => setActive(group.index)}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline py-7 md:py-8">
                  <span className="index-mark md:col-span-1">[{group.index}]</span>

                  <h3
                    className={`row-title md:col-span-4 transition-transform duration-500 ease-out ${
                      isActive ? 'md:translate-x-2' : ''
                    }`}
                    tabIndex={0}
                    data-cursor="active"
                  >
                    <EncryptedText text={group.title} />
                  </h3>

                  <p className="md:col-span-3 text-sm leading-relaxed opacity-75 text-pretty">
                    {group.note}
                  </p>

                  {/* The stack itself. Collapsed rows keep the list scannable;
                      the active row is the one you are actually reading. */}
                  <div className="md:col-span-4 flex flex-wrap gap-x-2 gap-y-1.5 md:justify-end">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className={`label border border-[#0a0a0a]/30 px-2 py-1 whitespace-nowrap transition-[opacity,background] duration-500 ${
                          isActive ? 'opacity-100 bg-[#0a0a0a]/8' : 'opacity-45'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-20 md:mt-28 -mx-6 md:-mx-10 border-y border-[#0a0a0a]/28 py-5">
        <VelocityMarquee
          items={MARQUEE}
          baseSpeed={40}
          className="display text-[clamp(1.75rem,4.5vw,4rem)]"
          separator={
            <span className="inline-block w-2.5 h-2.5 bg-[#0a0a0a] mx-6 md:mx-10 align-middle" />
          }
        />
      </div>
    </section>
  );
};
