import React, { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsPhone } from '../hooks/useIsPhone';

interface HeroSectionProps {
  /** Flips true when the preloader finishes; gates the entrance timeline. */
  ready: boolean;
}

/**
 * Two display words clamped to the top and bottom of the frame with the 3D
 * object suspended between them, and the supporting copy tucked into the
 * corners. The words are sized in vw so they touch both edges at any width —
 * that edge-to-edge tension is the whole composition.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ ready }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const isPhone = useIsPhone();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tehran',
        })
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (!ready || reduced) return;

      const tl = gsap.timeline({ defaults: { ease: 'arch' } });
      tl.from('.hero-word', { yPercent: 108, duration: 1.3, stagger: 0.12 })
        .from('.hero-meta', { opacity: 0, y: 14, duration: 0.8, stagger: 0.07 }, '-=0.8');

      // Wall-clock net: GSAP's ticker rides requestAnimationFrame, which is
      // suspended for hidden tabs. `progress(1)` resolves without a frame.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() < 1) tl.progress(1);
      }, 5000);

      return () => window.clearTimeout(failsafe);
    },
    { scope: sectionRef, dependencies: [ready, reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden pt-16 pb-8"
    >
      <h1 className="sr-only">
        Iman Mohammadi — creative engineer building interfaces, design systems and
        real-time graphics for the web
      </h1>

      {/* Upper word */}
      <div className="relative z-10 px-6 md:px-10">
        <div className="split-line-mask">
          <div className="hero-word display text-display-xl text-ink" aria-hidden="true">
            Creative
          </div>
        </div>
      </div>

      {/* Phones never mount the WebGL hero, so the object at the centre of the
          composition would simply be missing. This is its CSS stand-in: the
          same silhouette and lighting, drawn with gradients. On the stacked
          mobile layout there is no horizontal room to float it behind the
          corner copy the way the desktop canvas does, so it takes its own row
          between the words instead of sitting on top of the text. */}
      {isPhone && (
        <div className="hero-orb-row relative z-0 flex justify-center py-6" aria-hidden="true">
          <div className="hero-orb w-[62vw] max-w-[280px] aspect-square" />
        </div>
      )}

      {/* Corner copy. The 3D object occupies the middle of the frame, so the
          supporting text is pushed to the extremes rather than centred. */}
      <div className="relative z-10 px-6 md:px-10 flex items-end justify-between gap-8">
        <div className="hero-meta max-w-[22rem]">
          <p className="label text-ink mb-3">About</p>
          <p className="label text-ink-soft leading-relaxed">
            Building interfaces, design systems and real-time graphics for the web —
            with an eye on motion, typography and the frame budget.
          </p>
        </div>

        <div className="hero-meta hidden sm:flex items-center gap-8 label text-ink-soft">
          <span>
            Location: <span className="text-ink">Tehran</span>
          </span>
          <span className="text-ink tabular-nums">{clock}</span>
        </div>
      </div>

      {/* Lower word, right-aligned so the pair brackets the object diagonally */}
      <div className="relative z-10 px-6 md:px-10">
        <div className="split-line-mask">
          <div
            className="hero-word display text-display-xl text-ink text-right"
            aria-hidden="true"
          >
            Engineer
          </div>
        </div>

        <div className="hero-meta mt-6 flex items-center justify-between gap-6">
          <button
            onClick={() => scrollTo('#about')}
            className="btn-box"
            data-cursor="active"
          >
            <span className="w-1.5 h-1.5 bg-spot" aria-hidden="true" />
            Scroll
          </button>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('#contact'); }} className="btn-box" data-cursor="active">
            Let&apos;s create
          </a>
        </div>
      </div>
    </section>
  );
};
