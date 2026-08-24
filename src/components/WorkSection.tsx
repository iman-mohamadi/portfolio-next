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
 * Selected work as an index rather than a gallery: numbered rows with the
 * preview held in a single sticky plate that cross-fades to whichever row is
 * active. On touch and narrow screens each row carries its own image instead,
 * since there is no hover to drive the swap.
 */
export const WorkSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeKey, setActiveKey] = useState<ProjectKey>(PROJECTS[0].key);
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
      if (reduced) return;

      gsap.from('.work-line', {
        yPercent: 105,
        duration: 1.1,
        ease: 'arch',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      });

      gsap.from('.work-row', {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'arch',
        stagger: 0.09,
        scrollTrigger: { trigger: '.work-rows', start: 'top 84%', once: true },
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
        className="relative z-20 bg-paper pt-24 md:pt-36 pb-24 md:pb-32 px-6 md:px-10"
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
            Three projects that between them cover most of what I do — a system,
            a platform, and a renderer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12 items-start">
          {/* Sticky preview plate. Every image is mounted and cross-faded, so
              switching rows never waits on a decode. */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative aspect-[4/5] border border-ink/25 bg-paper-deep overflow-hidden">
              {PROJECTS.map((project) => (
                <img
                  key={project.key}
                  src={project.image}
                  alt={`${project.title} interface`}
                  loading="lazy"
                  aria-hidden={project.key !== activeKey}
                  className={`absolute inset-0 w-full h-full object-cover grayscale contrast-[1.2] transition-opacity duration-700 ease-out ${
                    project.key === activeKey ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <span className="absolute left-0 bottom-0 label bg-spot text-on-spot px-3 py-2">
                {PROJECTS.find((p) => p.key === activeKey)?.discipline}
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="work-rows lg:col-span-7">
            <ul>
              {PROJECTS.map((project) => (
                <li
                  key={project.key}
                  className="work-row group border-t border-rule last:border-b"
                  onMouseEnter={() => setActiveKey(project.key)}
                  onFocus={() => setActiveKey(project.key)}
                >
                  <div className="py-8 md:py-10">
                    <div className="flex items-baseline justify-between gap-6 mb-5">
                      <span className="index-mark">[{project.index}]</span>
                      <span className="label text-ink-faint">
                        {project.stack} — {project.year}
                      </span>
                    </div>

                    <button
                      onClick={() => open(project.key)}
                      className="block text-left w-full"
                      data-cursor="active"
                      data-cursor-text="OPEN"
                      aria-label={`${project.title} — ${project.cta}`}
                    >
                      <h3 className="display text-[clamp(2.25rem,6vw,4.5rem)] text-ink transition-transform duration-500 ease-out md:group-hover:translate-x-2">
                        {project.title}
                      </h3>
                    </button>

                    {/* Narrow screens have no hover, so the plate rides with
                        the row instead of sitting in a sticky column. */}
                    <div className="lg:hidden mt-6 aspect-[16/10] border border-ink/25 bg-paper-deep overflow-hidden">
                      <img
                        src={project.image}
                        alt={`${project.title} interface`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale contrast-[1.2]"
                      />
                    </div>

                    <p className="mt-6 max-w-[34rem] text-sm md:text-base text-ink-soft leading-relaxed text-pretty">
                      {project.summary}
                    </p>

                    <button
                      onClick={() => open(project.key)}
                      className="btn-box mt-7"
                      data-cursor="active"
                    >
                      <span className="w-1.5 h-1.5 bg-spot" aria-hidden="true" />
                      <EncryptedText text={project.cta} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap items-center gap-4">
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
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        {mounted.map((key) => {
          const Modal = MODALS[key];
          return <Modal key={key} isOpen={openModal === key} onClose={close} />;
        })}
      </Suspense>
    </>
  );
};
