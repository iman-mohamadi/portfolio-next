import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Capability {
  index: string;
  title: string;
  body: string;
  tags: string[];
}

const CAPABILITIES: Capability[] = [
  {
    index: '01',
    title: 'Interface engineering',
    body: 'Production React and Vue applications — routing, state, data fetching and the unglamorous parts that decide whether a product holds up after launch.',
    tags: ['React', 'Vue / Nuxt', 'TypeScript'],
  },
  {
    index: '02',
    title: 'Design systems',
    body: 'Tokens, primitives and documentation that survive contact with more than one team. Raya UI is the open one: published to npm, with its own CLI and docs site.',
    tags: ['Tokens', 'Headless UI', 'Docs / CLI'],
  },
  {
    index: '03',
    title: 'Motion & real-time graphics',
    body: 'GSAP choreography, scroll systems and hand-written GLSL. The object in the hero above is a shader running live — no video, no pre-render.',
    tags: ['GSAP', 'Three.js', 'GLSL'],
  },
  {
    index: '04',
    title: 'Performance',
    body: 'Bundle budgets, code splitting, render gating and a frame budget that holds on integrated graphics. Measured in a real browser, not asserted.',
    tags: ['Core Web Vitals', 'Code splitting', 'Profiling'],
  },
];

const COLLAGE = [
  { src: '/portrait-contact.png', alt: 'Portrait of Iman Mohammadi', className: 'col-span-7 aspect-[4/5]' },
  { src: '/work-raya.jpg', alt: 'Raya UI documentation', className: 'col-span-5 aspect-square mt-10' },
  { src: '/work-woodcoder.jpg', alt: 'Parametric 3D configurator', className: 'col-span-5 col-start-3 aspect-[5/4]' },
];

/**
 * The first full-bleed orange block. An image collage sits against an oversized
 * statement, then the capabilities run as numbered rows divided by hairlines —
 * a table of contents rather than a grid of cards.
 */
export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.about-line', {
        yPercent: 105,
        duration: 1.1,
        ease: 'arch',
        stagger: 0.09,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      });

      gsap.from('.about-row', {
        opacity: 0,
        y: 26,
        duration: 0.9,
        ease: 'arch',
        stagger: 0.08,
        scrollTrigger: { trigger: '.about-rows', start: 'top 82%', once: true },
      });

      // Each plate is revealed by its cover sliding off rather than by fading
      // in — the same wipe language as the section transitions, so the collage
      // reads as part of the same system. Staggered, so the cluster assembles
      // piece by piece instead of appearing at once.
      // fromTo rather than from: the resting state is set by a Tailwind
      // transform utility, and leaving GSAP to infer the end value means
      // trusting it to parse that matrix back into a scale. If it ever read
      // it wrong the cover would stay down and hide the plate for good.
      gsap.fromTo(
        '.about-plate-cover',
        { scaleY: 1 },
        {
          scaleY: 0,
          duration: 0.9,
          ease: 'arch',
          stagger: 0.13,
          scrollTrigger: { trigger: '.about-collage', start: 'top 82%', once: true },
        }
      );

      gsap.from('.about-plate', {
        y: 34,
        duration: 1,
        ease: 'arch',
        stagger: 0.13,
        scrollTrigger: { trigger: '.about-collage', start: 'top 82%', once: true },
      });

      // Drift afterwards, at different rates, so the settled cluster still has
      // depth as the section travels.
      gsap.utils.toArray<HTMLElement>('.about-plate').forEach((plate, i) => {
        gsap.to(plate, {
          yPercent: -6 - i * 4,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-label="About"
      className="bleed-spot relative z-20 pt-20 md:pt-24 pb-14 md:pb-16 px-6 md:px-10"
    >
      <div className="flex items-center gap-4 mb-10 md:mb-14">
        <span className="label">[ About ]</span>
        <span className="rule-h flex-1" />
        <span className="label">Tehran / Remote</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-16 items-start">
        {/* Statement */}
        <div className="lg:col-span-7 lg:order-2">
          <h2 className="display text-[clamp(2.25rem,6.2vw,5.5rem)] leading-[0.88] mb-10">
            <span className="split-line-mask block">
              <span className="about-line block">Engineer</span>
            </span>
            <span className="split-line-mask block">
              <span className="about-line block">who designs</span>
            </span>
          </h2>

          <div className="max-w-[38rem] space-y-5 text-[0.95rem] md:text-base leading-relaxed">
            <p>
              I&apos;m Iman Mohammadi — a full-stack engineer working out of Tehran, mostly
              on the front half: interfaces, design systems, and the motion that holds
              them together.
            </p>
            <p className="opacity-75">
              I like the problems that sit between design and engineering — where a
              component library has to stay coherent across teams, where a scroll has to
              feel deliberate instead of decorative, where a shader has to hold sixty
              frames on a laptop that isn&apos;t new. Most of what I build ends up open
              source.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-10">
            <a
              href="https://github.com/iman-mohamadi"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-box"
              data-cursor="active"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/iman-mohammadiii/"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-box"
              data-cursor="active"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Collage */}
        <div className="about-collage lg:col-span-5 lg:order-1 grid grid-cols-12 gap-3 md:gap-4">
          {COLLAGE.map((plate) => (
            <div
              key={plate.src}
              className={`about-plate relative overflow-hidden bg-on-spot/8 ${plate.className}`}
            >
              <img
                src={plate.src}
                alt={plate.alt}
                loading="lazy"
                className="w-full h-full object-cover grayscale contrast-[1.1] brightness-[1.35]"
              />
              {/* Cover in the ground colour, scaled away from the bottom on
                  entry. Painted rather than a clip-path so it matches the
                  orange exactly while it is still covering the plate. */}
              <div
                className="about-plate-cover absolute inset-0 origin-bottom bg-spot scale-y-0 [background:var(--color-spot)]"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Numbered capability rows */}
      <div className="about-rows mt-16 md:mt-20">
        <div className="flex items-baseline justify-between gap-6 mb-2">
          <span className="label">What I do</span>
          <span className="label">04 / disciplines</span>
        </div>

        <ul>
          {CAPABILITIES.map((cap) => (
            <li
              key={cap.index}
              className="about-row sweep-row group border-t border-on-spot/18 last:border-b py-7 md:py-9"
              tabIndex={0}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                <span className="index-mark md:col-span-1">[{cap.index}]</span>

                <h3 className="row-title md:col-span-4 transition-transform duration-500 ease-out md:group-hover:translate-x-2">
                  {cap.title}
                </h3>

                <p className="sweep-dim md:col-span-5 text-sm leading-relaxed opacity-80 text-pretty">
                  {cap.body}
                </p>

                <div className="md:col-span-2 flex md:flex-col md:items-end flex-wrap gap-x-3 gap-y-1">
                  {cap.tags.map((tag) => (
                    <span key={tag} className="label whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
