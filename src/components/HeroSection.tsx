import React, { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLensEligible } from '../hooks/useLensEligible';
import { HeroMusicPlayer } from './HeroMusicPlayer';

interface HeroSectionProps {
  /** Flips true when the preloader finishes; gates the entrance timeline. */
  ready: boolean;
}

/**
 * The hero.
 *
 * The wordmark lives in the WebGL layer, because the entire concept is that
 * you are looking at it through an optic and the DOM cannot be refracted. When
 * the optic is not available — phone, reduced motion, no WebGL — the same two
 * words render here instead, at the same scale and in the same places, and
 * nothing about the composition is missing. Exactly one of the two ever
 * renders; `useLensEligible` is the shared answer to which.
 *
 * The supporting copy is always DOM. It is content, it must be selectable and
 * indexable, and putting it in a texture to make it match would be the wrong
 * trade in every direction.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ ready }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const lensOwnsWordmark = useLensEligible();
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
      if (!ready) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        // No displacement, no split. The content is simply there.
        gsap.set('.hero-word, .hero-meta', { opacity: 1, clearProps: 'transform' });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'arch' } });

        // Beat 1 — the mark, but only when the DOM is the one holding it.
        // Tweening an absent selector is not merely a no-op: GSAP inserts a
        // zero-duration placeholder, and every relative position offset below
        // ("-=0.98") is then measured from the wrong point, so the whole
        // entrance collapses into a single beat on exactly the machines where
        // the optic is doing the work.
        if (!lensOwnsWordmark) {
          tl.from('.hero-word', { yPercent: 108, duration: 1.3, stagger: 0.12 });
        } else {
          // Hold the same beat open so the choreography below is identical
          // either way. The optic runs its own resolve over this window.
          tl.to({}, { duration: 1.3 });
        }

        // Beat 2 — supporting copy, overlapping. Nothing waits its turn.
        tl.from('.hero-meta', { opacity: 0, y: 14, duration: 0.8, stagger: 0.07 }, '-=0.98')
          // Beat 3 — the rules draw. Secondary action: it reads as a
          // consequence of the copy landing, not as its own event.
          .from('.hero-rule', { scaleX: 0, duration: 0.7, stagger: 0.05 }, '-=0.72');

        // Wall-clock net: GSAP's ticker rides requestAnimationFrame, which is
        // suspended for hidden tabs. `progress(1)` resolves without a frame.
        const failsafe = window.setTimeout(() => {
          if (tl.progress() < 1) tl.progress(1);
        }, 5000);

        return () => window.clearTimeout(failsafe);
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [ready, reduced, lensOwnsWordmark] }
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden pt-16 pb-8"
    >
      {/* Holographic grid overlay */}
      <div className="cyber-grid" aria-hidden="true" />

      <h1 className="sr-only">
        Iman Mohammadi — creative engineer building interfaces, design systems and
        real-time graphics for the web
      </h1>

      {/* Upper word. Absent when the optic owns it. */}
      <div className="relative z-10 px-6 md:px-10">
        {!lensOwnsWordmark && (
          <div className="split-line-mask">
            <div className="hero-word display text-display-xl text-ink" aria-hidden="true">
              Creative
            </div>
          </div>
        )}
      </div>

      {/* Corner copy. The optic occupies the middle of the frame, so the
          supporting text is pushed to the extremes rather than centred. */}
      {/* `xl:pr-52` clears the IndexRail, which is fixed to the right gutter
          from `xl` up. Without it the location/clock readout sits directly on
          top of the section navigator — both are right-aligned mono at the
          same scale, so they do not merely overlap, they become unreadable. */}
      <div className="relative z-10 px-6 md:px-10 xl:pr-52 flex items-end justify-between gap-8">
        <div className="hero-meta max-w-[22rem]">
          <div className="hero-rule rule-h origin-left mb-4" aria-hidden="true" />
          <p className="label text-ink mb-3">About</p>
          <p className="text-sm text-ink-soft leading-relaxed">
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

      {/* Same clearance for the player — it parks in the right gutter too. */}
      <HeroMusicPlayer className="hero-meta hidden md:block absolute right-10 xl:right-52 top-[55%] z-10" />

      {/* Lower word, right-aligned so the pair brackets the optic diagonally. */}
      <div className="relative z-10 px-6 md:px-10">
        {!lensOwnsWordmark && (
          <div className="split-line-mask">
            <div
              className="hero-word display text-display-xl text-ink text-right"
              aria-hidden="true"
            >
              Engineer
            </div>
          </div>
        )}

        <div className="hero-rule rule-h origin-left mt-8" aria-hidden="true" />

        <div className="hero-meta mt-6 flex items-center justify-between gap-6">
          <button onClick={() => scrollTo('#about')} className="btn-box" data-cursor="active">
            <span className="w-1.5 h-1.5 rounded-full bg-neon led-pulse" aria-hidden="true" />
            Scroll
          </button>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('#contact');
            }}
            className="btn-box"
            data-cursor="active"
          >
            Let&apos;s create
          </a>
        </div>
      </div>
    </section>
  );
};
