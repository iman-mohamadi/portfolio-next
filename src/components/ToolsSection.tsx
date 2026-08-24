import React, { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PixelPath } from './tools/PixelPath';
import { ChromaWarp, SplitMask, TextMaze, ParticleCloud } from './tools/studies';

interface Study {
  index: string;
  name: string;
  note: string;
  /** Panel ground — the reference alternates dark and light plates. */
  tone: 'dark' | 'light';
  render: () => React.ReactNode;
}

const STUDIES: Study[] = [
  {
    index: '001',
    name: 'Chroma warp',
    note: 'Per-channel offset on mirrored type.',
    tone: 'dark',
    render: () => <ChromaWarp />,
  },
  {
    index: '002',
    name: 'Split mask',
    note: 'Stripe mask swept over outlined glyphs.',
    tone: 'dark',
    render: () => <SplitMask />,
  },
  {
    index: '003',
    name: 'Text maze',
    note: 'Characters settling out of a scramble.',
    tone: 'light',
    render: () => <TextMaze />,
  },
  {
    index: '004',
    name: 'Particles',
    note: 'Canvas cloud gathering into a plume.',
    tone: 'light',
    render: () => <ParticleCloud />,
  },
];

/**
 * The studies run on a horizontal track pinned to the viewport, so vertical
 * scroll drives sideways travel — the same trick the reference uses to make
 * the section read as a reel rather than a grid.
 *
 * A block staircase spans the full track width with a sprite running along
 * its crest, passing behind the study plates. Under `lg`, or with reduced
 * motion, the pin is dropped entirely and the studies simply stack.
 */
export const ToolsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const reduced = useReducedMotion();

  // The path canvas needs the track's real scroll width, which is only known
  // after the panels have laid out.
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setTrackWidth(trackRef.current.scrollWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useGSAP(
    () => {
      gsap.from('.tools-line', {
        yPercent: 105,
        duration: 1.1,
        ease: 'arch',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current;
        const section = sectionRef.current;
        if (!track || !section) return;

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // This pin inserts a spacer that pushes every later section down,
            // so it has to be measured before anything that reads those
            // sections' positions — otherwise ScrollBackdrop computes its
            // boundaries against a document that does not exist yet and the
            // ground wipes to the next colour while this section is still
            // pinned on screen.
            refreshPriority: 1,
          },
        });

        return () => tween.kill();
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="tools"
      aria-label="Tools and studies"
      className="bleed-spot relative z-20 lg:h-[100svh] lg:overflow-hidden py-20 lg:py-0 lg:flex lg:flex-col"
    >
      <div className="px-6 md:px-10 lg:pt-20 shrink-0">
        <div className="flex items-center gap-4 mb-8">
          <span className="label">[ Tools ]</span>
          <span className="rule-h flex-1" />
          <span className="label">Studies / 004</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h2 className="display text-[clamp(2.5rem,8vw,7rem)]">
            <span className="split-line-mask block">
              <span className="tools-line block">Tools</span>
            </span>
          </h2>
          <p className="max-w-[30rem] text-sm md:text-base leading-relaxed opacity-80 lg:pb-3">
            No allegiances — whatever gets it built and keeps it maintainable a
            year later. These are the small things I write to keep the hand in.
          </p>
        </div>
      </div>

      {/* Track */}
      <div className="lg:flex-1 lg:flex lg:items-center mt-14 lg:mt-0 overflow-x-auto lg:overflow-visible">
        <div
          ref={trackRef}
          className="relative flex items-end gap-8 md:gap-14 px-6 md:px-10 lg:pr-[35vw] w-max"
        >
          {/* Terrain + runner, spanning the whole track behind the plates. */}
          <div className="pointer-events-none absolute left-0 bottom-0 z-0">
            <PixelPath width={trackWidth} className="block" />
          </div>

          {STUDIES.map((study) => (
            /* Bottom margin clears the terrain band (7 blocks tall) so the
               captions sit above it rather than on top of the blocks. */
            <figure
              key={study.index}
              className="relative z-10 shrink-0 w-[78vw] sm:w-[52vw] lg:w-[34vw] max-w-[520px] mb-[190px]"
            >
              <div
                className={`relative aspect-[16/10] overflow-hidden ${
                  study.tone === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#e9e8e4]'
                }`}
              >
                {study.render()}
              </div>

              <figcaption className="flex items-baseline justify-between gap-4 pt-3">
                <span className="label">{study.name}</span>
                <span className="label">{study.index}</span>
              </figcaption>
              <p className="sweep-dim text-xs leading-relaxed opacity-70 mt-1 max-w-[26rem]">
                {study.note}
              </p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
