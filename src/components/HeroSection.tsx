import React, { useMemo, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { hasWebGL } from '../lib/motion';
import { useIsPhone } from '../hooks/useIsPhone';
import { HERO_PORTRAIT } from '../content/media';

const STATS = [
  { value: 'Nine', label: 'Years' },
  { value: 'Ninety-three', label: 'Systems' },
  { value: 'Four', label: 'Continents' },
];

interface HeroSectionProps {
  /** Flips true when the preloader finishes; gates the entrance timeline. */
  ready: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ ready }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();

  // The wordmark and portrait plate live in the WebGL layer on wide screens.
  // Phones fall back to real type: the particle wordmark is illegible at that
  // scale, and if the canvas fails to acquire a context the hero would
  // otherwise render completely empty.
  const webgl = useMemo(() => hasWebGL(), []);
  const isPhone = useIsPhone();
  const domHero = !webgl || reduced || isPhone;

  useGSAP(
    () => {
      if (!ready || reduced) return;

      const tl = gsap.timeline({ defaults: { ease: 'arch' } });
      tl.from('.hero-anim', { opacity: 0, y: 16, duration: 0.9, stagger: 0.08, delay: 0.4 });

      if (domHero) {
        tl.from('.hero-line', { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0);
      }

      // Wall-clock net: GSAP's ticker rides requestAnimationFrame, which is
      // suspended for hidden tabs. `progress(1)` resolves without a frame.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() < 1) tl.progress(1);
      }, 5000);

      // Parallax only where the hero has headroom. On a phone the standfirst,
      // buttons and stats nearly fill the section, so translating them down 45%
      // pushed them into the section's own `overflow-hidden` and sheared the
      // stat figures in half at the boundary.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        gsap.to('.hero-parallax', {
          yPercent: 45,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });
      });

      return () => {
        window.clearTimeout(failsafe);
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [ready, reduced, domHero] }
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="relative min-h-[100svh] flex flex-col justify-between gap-8 overflow-hidden px-6 md:px-12 pt-28 md:pt-32 pb-8"
    >
      {/* Masthead rule */}
      <div className="relative z-10 shrink-0">
        <div className="hero-anim flex items-baseline justify-between gap-6 pb-4 border-b border-ink">
          <span className="label flex items-center gap-2.5 text-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-spot" aria-hidden="true" />
            Available for 2026
          </span>
          <span className="label text-ink-faint hidden sm:block">Tehran, Iran</span>
        </div>
      </div>

      {/*
        Centre stage belongs to the WebGL wordmark. The heading stays in the
        document for assistive tech and search either way; it only becomes
        visible when the canvas can't render it.
      */}
      <div className="relative z-10 flex-1 flex items-center pointer-events-none">
        {domHero ? (
          <div className="w-full grid lg:grid-cols-12 gap-10 items-center pointer-events-auto">
            <h1 className="lg:col-span-7 font-display font-black text-ink select-none text-display-xl">
              <span className="split-line-mask block">
                <span className="hero-line block">Iman</span>
              </span>
              <span className="split-line-mask block">
                <span className="hero-line block italic">Mohammadi</span>
              </span>
            </h1>

            <figure className="lg:col-span-5 relative w-40 sm:w-56 lg:w-full max-w-xs lg:ml-auto">
              <img
                data-preload
                alt="Iman Mohammadi"
                className="w-full aspect-[4/5] object-cover object-center grayscale contrast-125"
                src={HERO_PORTRAIT}
                referrerPolicy="no-referrer"
              />
            </figure>
          </div>
        ) : (
          <h1 className="sr-only">Iman Mohammadi — Front-End Architect and WebGL Specialist</h1>
        )}
      </div>

      {/* Standfirst, actions, and the colophon line */}
      <div className="relative z-10 hero-parallax shrink-0 flex flex-col gap-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="hero-anim lg:col-span-7">
            <p className="font-display italic text-display-sm text-ink mb-4">
              Front-end architect &amp; WebGL specialist
            </p>
            <p className="font-body text-base md:text-lg text-ink-soft leading-relaxed max-w-xl text-balance-tight">
              I build the structural layer of the web — design systems, rendering
              pipelines and interfaces that hold their shape at scale.
            </p>
          </div>

          <div className="hero-anim lg:col-span-5 flex flex-wrap items-center gap-3 lg:justify-end">
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('#work');
              }}
              className="btn-swap bg-ink text-paper px-8 py-4 label"
              data-cursor="active"
            >
              <span className="btn-swap-inner flex items-center gap-2">
                Selected work <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span className="btn-swap-clone bg-spot gap-2" aria-hidden="true">
                Selected work <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </a>

            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('#contact');
              }}
              className="border border-ink text-ink hover:bg-ink hover:text-paper px-8 py-4 label transition-colors duration-500"
              data-cursor="active"
            >
              Start a project
            </a>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-6 pt-5 border-t border-rule">
          <button
            onClick={() => scrollTo('#manifesto')}
            className="hero-anim group flex items-center gap-3 text-ink-faint hover:text-ink transition-colors duration-500 self-start"
            data-cursor="active"
            aria-label="Scroll to next section"
          >
            <span className="w-9 h-9 rounded-full border border-rule group-hover:border-ink flex items-center justify-center transition-colors duration-500">
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform duration-500" />
            </span>
            <span className="label">Scroll</span>
          </button>

          <dl className="hero-anim grid grid-cols-3 gap-5 sm:flex sm:gap-10 md:gap-14 w-full sm:w-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="sm:text-right min-w-0">
                <dt className="label text-ink-faint mb-1.5 truncate">{stat.label}</dt>
                <dd className="font-display text-lg sm:text-xl md:text-2xl text-ink">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};
