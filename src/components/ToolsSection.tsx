import React, { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { StairProgress } from './tools/StairProgress';
import { PixelRunner } from './tools/PixelRunner';
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
    index: '000',
    name: 'Runman',
    note: 'A looping motion mark as the lead-in for the reel — it sets the pace before the studies begin.',
    tone: 'dark',
    render: () => (
      <div className="absolute inset-0 flex items-center justify-center text-[#e9e8e4]">
        <PixelRunner scale={5} />
      </div>
    ),
  },
  {
    index: '001',
    name: 'Chroma warp',
    note: 'Per-channel offset on mirrored type — a reusable art-direction test for layered media and live typography.',
    tone: 'dark',
    render: () => <ChromaWarp />,
  },
  {
    index: '002',
    name: 'Split mask',
    note: 'A stripe mask swept over outlined glyphs — a compact prototype for opening and revealing content.',
    tone: 'dark',
    render: () => <SplitMask />,
  },
  {
    index: '003',
    name: 'Text maze',
    note: 'Characters settling out of a scramble — procedural variation that shifts without losing the system.',
    tone: 'light',
    render: () => <TextMaze />,
  },
  {
    index: '004',
    name: 'Particles',
    note: 'A canvas cloud gathering into a plume — weight, depth and pacing kept inside the frame budget.',
    tone: 'light',
    render: () => <ParticleCloud />,
  },
];

/** Pixel-flash grid over each slide, matching the reference's 8 x 9. */
const FLASH_COLS = 8;
const FLASH_ROWS = 9;

/**
 * The studies as a pinned reel, rebuilt to the reference's layout: the whole
 * viewport holds still while scroll steps through one study at a time. Each
 * step swaps the media plate under a burst of pixel cells, rolls the title and
 * the two counters like odometers, and crossfades the study note. A pixel
 * staircase descends behind the stage as the section's progress mark, with the
 * runner standing on the lowest built step.
 *
 * Everything per-tick is written imperatively — the only React state here is
 * mount-time structure. Under `lg`, or with reduced motion, the pin is dropped
 * and the studies simply stack.
 */
export const ToolsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stacksRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(0);
  const reduced = useReducedMotion();

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
        const section = sectionRef.current;
        const stage = stageRef.current;
        const copy = copyRef.current;
        const stacks = stacksRef.current;
        if (!section || !stage || !copy || !stacks) return;

        const slides = Array.from(stage.querySelectorAll<HTMLElement>('.tools-slide'));
        const flashes = Array.from(stage.querySelectorAll<HTMLElement>('.tools-flash'));
        const copies = Array.from(copy.querySelectorAll<HTMLElement>('.tools-copy-layer'));
        const rolls = Array.from(stacks.querySelectorAll<HTMLElement>('.tools-roll'));

        // Randomised once: every swap reuses the same scatter, which is what
        // the reference does — the pattern is a texture, not a lottery.
        flashes.forEach((layer) => {
          Array.from(layer.children).forEach((cell) => {
            (cell as HTMLElement).style.setProperty(
              '--flash-delay',
              `${(Math.random() * 0.28).toFixed(3)}s`
            );
          });
        });

        const apply = (index: number, flash: boolean) => {
          slides.forEach((el, i) => {
            el.style.opacity = i === index ? '1' : '0';
            el.style.zIndex = i === index ? '2' : '1';
          });
          copies.forEach((el, i) => {
            el.style.opacity = i === index ? '1' : '0';
          });
          rolls.forEach((el) => {
            el.style.transform = `translate3d(0, ${(-index * 100) / STUDIES.length}%, 0)`;
          });
          if (flash) {
            const layer = flashes[index];
            layer.classList.remove('is-flashing');
            // Restart the cell animation from zero on every swap.
            void layer.offsetWidth;
            layer.classList.add('is-flashing');
          }
        };
        apply(0, false);
        activeRef.current = 0;

        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * (STUDIES.length - 1) * 0.7}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // This pin's spacer moves every later section, so it must be
          // measured before anything reading their positions — the ground
          // boundaries in ScrollBackdrop most of all.
          refreshPriority: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            const next = Math.min(
              STUDIES.length - 1,
              Math.round(self.progress * (STUDIES.length - 1))
            );
            if (next !== activeRef.current) {
              activeRef.current = next;
              apply(next, true);
            }
          },
        });

        return () => st.kill();
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
      <div className="px-6 md:px-10 lg:pt-16 shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <span className="label">[ Tools ]</span>
          <span className="rule-h flex-1" />
          <span className="label">Studies / 005</span>
        </div>

        <h2 className="display text-[clamp(2.5rem,8vw,6.5rem)] text-center leading-[0.85]">
          <span className="split-line-mask block">
            <span className="tools-line block">Tools</span>
          </span>
        </h2>
      </div>

      {/* Desktop reel: everything pinned, scroll steps the active study. */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col px-10 min-h-0">
        {/* Staircase progress mark, behind the stage. */}
        <div className="pointer-events-none absolute left-0 top-[38svh] z-0">
          <StairProgress progressRef={progressRef} />
        </div>

        <div className="relative z-10 flex-1 grid grid-cols-12 gap-8 items-center min-h-0">
          {/* Study note + scroll cue */}
          <div ref={copyRef} className="col-span-3 relative self-start pt-[9svh]">
            {STUDIES.map((study, i) => (
              <div
                key={study.index}
                className="tools-copy-layer absolute inset-x-0 top-[9svh]"
                style={{ opacity: i === 0 ? 1 : 0 }}
                aria-hidden={i === 0 ? undefined : true}
              >
                <p className="text-xs leading-relaxed max-w-[24rem] opacity-85">
                  {study.note}
                </p>
              </div>
            ))}
            <p className="label absolute top-[24svh] right-0 text-right">Scroll ↓</p>
          </div>

          {/* Stage: one plate visible at a time, swapped under a pixel burst. */}
          <div className="col-span-6 col-start-5 flex items-center justify-center">
            <div
              ref={stageRef}
              className="relative w-full max-w-[720px] aspect-[16/10] overflow-hidden"
            >
              {STUDIES.map((study, i) => (
                <div
                  key={study.index}
                  className={`tools-slide absolute inset-0 transition-opacity duration-150 ${
                    study.tone === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#e9e8e4]'
                  }`}
                  style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 2 : 1 }}
                >
                  {study.render()}
                  {/* Pixel burst covering the swap, in the section ground. */}
                  <div className="tools-flash absolute inset-0 z-10" aria-hidden="true">
                    {Array.from({ length: FLASH_COLS * FLASH_ROWS }, (_, n) => {
                      const c = n % FLASH_COLS;
                      const r = Math.floor(n / FLASH_COLS);
                      return (
                        <span
                          key={n}
                          className="tools-flash-cell bg-neon"
                          style={{
                            left: `${(c / FLASH_COLS) * 100}%`,
                            top: `${(r / FLASH_ROWS) * 100}%`,
                            width: `calc(${100 / FLASH_COLS}% + 1px)`,
                            height: `calc(${100 / FLASH_ROWS}% + 1px)`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer strip: rolling title + counters between two rules. */}
        <div ref={stacksRef} className="relative z-10 shrink-0 border-t border-b border-on-spot/25 py-3 mb-8 flex items-end justify-between gap-8">
          <div className="flex items-end gap-5">
            <div className="tools-roll-mask h-[1.1em] text-[clamp(1rem,1.6vw,1.4rem)]">
              <div className="tools-roll">
                {STUDIES.map((s, i) => (
                  <p key={s.index} className="h-[1.1em] leading-[1.1] font-mono-tech" aria-hidden="true">
                    {i}
                  </p>
                ))}
              </div>
            </div>
            <div className="tools-roll-mask h-[1.1em] text-[clamp(1.75rem,3.4vw,3.25rem)]">
              <div className="tools-roll">
                {STUDIES.map((s) => (
                  <h3 key={s.index} className="display h-[1.1em] leading-[1.05] whitespace-nowrap">
                    {s.name}
                  </h3>
                ))}
              </div>
            </div>
          </div>

          <div className="tools-roll-mask h-[1.1em] text-[clamp(1.75rem,3.4vw,3.25rem)]">
            <div className="tools-roll">
              {STUDIES.map((s) => (
                <p key={s.index} className="display h-[1.1em] leading-[1.05] text-right" aria-hidden="true">
                  {s.index}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stacked list under lg, and the accessible version of the reel. */}
      <div className="lg:hidden mt-12 px-6 md:px-10 space-y-14">
        {STUDIES.map((study) => (
          <figure key={study.index}>
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
            <p className="text-xs leading-relaxed opacity-70 mt-1 max-w-[26rem]">{study.note}</p>
          </figure>
        ))}
      </div>
    </section>
  );
};
