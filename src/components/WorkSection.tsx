import React, { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { EncryptedText } from './motion/EncryptedText';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Case-study modals carry the heaviest dependencies on the page — the Woodcoder
// one pulls in all of Three.js. Loading them statically put the entire renderer
// in the entry bundle for visitors who never open a case study.
const RayaMetricsModal = lazy(() =>
  import('./RayaMetricsModal').then((m) => ({ default: m.RayaMetricsModal }))
);
const HotelyarCaseStudyModal = lazy(() =>
  import('./HotelyarCaseStudyModal').then((m) => ({ default: m.HotelyarCaseStudyModal }))
);
const Woodcoder3DModal = lazy(() =>
  import('./Woodcoder3DModal').then((m) => ({ default: m.Woodcoder3DModal }))
);

const MODALS = {
  raya: RayaMetricsModal,
  hotelyar: HotelyarCaseStudyModal,
  woodcoder: Woodcoder3DModal,
} as const;

type ProjectKey = 'raya' | 'hotelyar' | 'woodcoder';

interface WorkProject {
  key: ProjectKey;
  index: string;
  title: string;
  discipline: string;
  summary: string;
  year: string;
  stack: string;
  cta: string;
  image: string;
}

const PROJECTS: WorkProject[] = [
  {
    key: 'raya',
    index: '01',
    title: 'Raya UI',
    discipline: 'Design system',
    summary:
      'An open component library and design system — tokenised primitives, a docs site, and a CLI that scaffolds components straight into a project.',
    year: '2025',
    stack: 'Vue / TypeScript',
    cta: 'View metrics',
    image: '/work-raya.jpg',
  },
  {
    key: 'hotelyar',
    index: '02',
    title: 'Hotelyar',
    discipline: 'Product platform',
    summary:
      'A reservation platform where server rendering and cache strategy decide the experience — every millisecond of TTFB is visible in the funnel.',
    year: '2024',
    stack: 'Nuxt / Node',
    cta: 'View platform',
    image: '/work-hotelyar.jpg',
  },
  {
    key: 'woodcoder',
    index: '03',
    title: 'Woodcoder',
    discipline: 'Real-time 3D',
    summary:
      'A parametric configurator running in the browser: geometry rebuilt live from the parameters, custom material shaders, and a frame budget that holds on integrated graphics.',
    year: '2024',
    stack: 'Three.js / GLSL',
    cta: 'Launch experience',
    image: '/work-woodcoder.jpg',
  },
];

/**
 * Selected work as a deck rather than a list: each project is a full-bleed
 * card that sticks to the top of the frame and holds there while the next one
 * scrolls up to cover it, so the projects physically stack as you go — the
 * previous card stays put and just gets buried under the next, instead of
 * sliding away. A light scale/dim on the outgoing card as the next one
 * arrives is the only extra motion; the stacking itself is plain
 * `position: sticky`, which needs no scroll-jacking to work.
 */
export const WorkSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [openModal, setOpenModal] = useState<ProjectKey | null>(null);
  // Once a modal has been opened it stays mounted, so its close animation can
  // finish and reopening is instant.
  const [mounted, setMounted] = useState<ProjectKey[]>([]);
  const reduced = useReducedMotion();

  const open = useCallback((key: ProjectKey) => {
    setMounted((keys) => (keys.includes(key) ? keys : [...keys, key]));
    setOpenModal(key);
  }, []);

  const close = useCallback(() => setOpenModal(null), []);

  useGSAP(
    () => {
      gsap.from('.work-line', {
        yPercent: 105,
        duration: 1.1,
        ease: 'arch',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });

      if (reduced) return;

      // Depth cue: as the next card's wrapper scrolls up to cover the current
      // one, the current card eases back and dims — it reads as a card being
      // laid on a table rather than a hard cut to the next.
      const wraps = gsap.utils.toArray<HTMLElement>('.work-card-wrap');
      wraps.forEach((wrap, i) => {
        const next = wraps[i + 1];
        const inner = wrap.querySelector('.work-card-inner');
        if (!next || !inner) return;

        gsap.to(inner, {
          scale: 0.92,
          filter: 'brightness(0.55)',
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
        });
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <>
      <section
        ref={sectionRef}
        id="work"
        aria-label="Selected work"
        className="relative z-20 pt-24 md:pt-36 px-6 md:px-10"
      >
        <div className="flex items-center gap-4 mb-12 md:mb-16">
          <span className="label text-ink">[ Work ]</span>
          <span className="rule-h flex-1" />
          <span className="label text-ink">03 / selected</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 items-end mb-16 md:mb-24">
          <h2 className="lg:col-span-8 display text-[clamp(3rem,12vw,11rem)] text-ink">
            <span className="split-line-mask block">
              <span className="work-line block">Work</span>
            </span>
          </h2>
          <p className="lg:col-span-4 max-w-[28rem] text-sm md:text-base text-ink-soft leading-relaxed lg:pb-4">
            Three projects, stacked in scroll order — a system, a platform, and
            a renderer.
          </p>
        </div>
      </section>

      {/* The stack. Each wrapper is taller than the viewport so its card has
          room to hold at the top before the next wrapper's turn arrives. */}
      <div className="relative z-20">
        {PROJECTS.map((project, i) => (
          <div key={project.key} className="work-card-wrap relative h-[160svh]">
            <div
              className="work-card-inner sticky top-0 h-[100svh] w-full origin-top overflow-hidden"
              style={{ zIndex: i + 1 }}
            >
              <img
                src={project.image}
                alt={`${project.title} interface`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.15]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"
                aria-hidden="true"
              />

              <div className="relative z-10 h-full flex flex-col justify-between px-6 md:px-10 py-8 md:py-12 max-w-[1440px] mx-auto">
                <div className="flex items-center justify-between">
                  <span className="label text-[#f2f1ec]/70">[{project.index}]</span>
                  <span className="label text-[#f2f1ec]/70">
                    {project.stack} — {project.year}
                  </span>
                </div>

                <div>
                  <p className="label text-spot mb-4">{project.discipline}</p>

                  <button
                    onClick={() => open(project.key)}
                    className="block text-left"
                    data-cursor="active"
                    data-cursor-text="OPEN"
                    aria-label={`${project.title} — ${project.cta}`}
                  >
                    <h3 className="display text-[clamp(2.75rem,9vw,8rem)] leading-[0.86] text-[#f2f1ec] mb-6">
                      {project.title}
                    </h3>
                  </button>

                  <p className="max-w-[36rem] text-sm md:text-base text-[#f2f1ec]/80 leading-relaxed mb-8 text-pretty">
                    {project.summary}
                  </p>

                  <button
                    onClick={() => open(project.key)}
                    className="btn-box"
                    style={{ borderColor: '#f2f1ec', color: '#f2f1ec' }}
                    data-cursor="active"
                  >
                    <span className="w-1.5 h-1.5 bg-spot" aria-hidden="true" />
                    <EncryptedText text={project.cta} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-20 px-6 md:px-10 py-12 flex flex-wrap items-center gap-4">
        <span className="label text-ink-faint">More on</span>
        <a
          href="https://github.com/iman-mohamadi"
          target="_blank"
          rel="noreferrer noopener"
          className="btn-box"
          data-cursor="active"
        >
          <EncryptedText text="GitHub" />
        </a>
      </div>

      <Suspense fallback={null}>
        {mounted.map((key) => {
          const Modal = MODALS[key];
          return <Modal key={key} isOpen={openModal === key} onClose={close} />;
        })}
      </Suspense>
    </>
  );
};
