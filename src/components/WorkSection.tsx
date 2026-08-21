import React, { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import { Reveal } from './motion/Reveal';
import { Magnetic } from './motion/Magnetic';

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
  stack: string;
  status: string;
  cta: string;
  image: string;
}

const PROJECTS: WorkProject[] = [
  {
    key: 'raya',
    index: '01',
    title: 'RAYA UI',
    discipline: 'Component Architecture',
    summary:
      'An enterprise design system built to stay coherent across forty product teams — tokenised, versioned, and rendered identically on every surface.',
    stack: 'React / TypeScript',
    status: 'Design system — 40 teams',
    cta: 'View metrics',
    image:
      '/work-raya.jpg',
  },
  {
    key: 'hotelyar',
    index: '02',
    title: 'HOTELYAR',
    discipline: 'SSG / SSR Mastery',
    summary:
      'A reservation routing matrix handling 1.2M queries per second, where every millisecond of TTFB was worth measurable revenue.',
    stack: 'Vue / Nuxt',
    status: 'Reservations — 1.2M q/s',
    cta: 'View platform',
    image:
      '/work-hotelyar.jpg',
  },
  {
    key: 'woodcoder',
    index: '03',
    title: 'WOODCODER',
    discipline: 'Parametric Geometry',
    summary:
      'A live parametric modelling engine in the browser: real-time mesh generation, custom material shaders, and a 60fps floor on integrated GPUs.',
    stack: 'WebGL / Three.js',
    status: 'Parametric engine — live 3D',
    cta: 'Launch experience',
    image:
      '/work-woodcoder.jpg',
  },
];

export const WorkSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [openModal, setOpenModal] = useState<ProjectKey | null>(null);
  // Once a modal has been opened it stays mounted, so its close animation can
  // finish and reopening is instant.
  const [mounted, setMounted] = useState<ProjectKey[]>([]);

  const open = useCallback((key: ProjectKey) => {
    setMounted((keys) => (keys.includes(key) ? keys : [...keys, key]));
    setOpenModal(key);
  }, []);

  const close = useCallback(() => setOpenModal(null), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Horizontal pinning only where there is room for it and the visitor
      // hasn't asked for less motion. Everywhere else the panels simply stack.
      mm.add(
        '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        () => {
          const track = trackRef.current;
          const section = sectionRef.current;
          if (!track || !section) return;

          const distance = () => track.scrollWidth - window.innerWidth;

          const tween = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (progressRef.current) {
                  gsap.set(progressRef.current, { scaleX: self.progress });
                }
              },
            },
          });

          // Counter-parallax inside each frame: the image drifts against the
          // horizontal travel, so the panels gain depth instead of sliding flat.
          const panels = gsap.utils.toArray<HTMLElement>('.work-panel');
          panels.forEach((panel) => {
            const img = panel.querySelector('.work-image');
            if (!img) return;
            gsap.fromTo(
              img,
              { xPercent: -8, scale: 1.14 },
              {
                xPercent: 8,
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              }
            );
          });

          return () => {
            tween.kill();
          };
        }
      );

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <>
      <section
        ref={sectionRef}
        id="work"
        aria-label="Selected work"
        className="relative z-20 bg-paper-dim border-t border-rule overflow-hidden lg:h-[100svh] py-24 lg:py-0"
      >
        <div className="lg:h-full lg:flex lg:flex-col">
          {/* Header. The heading is deliberately mid-scale here: at display-lg
              it overlapped the pinned track, because the track is vertically
              centred in the remaining height rather than pushed below. */}
          <div className="max-w-[1440px] w-full mx-auto px-6 md:px-12 lg:pt-24 shrink-0">
            <div className="flex items-center gap-4 mb-6">
              <span className="label text-ink-faint">(02)</span>
              <span className="h-px flex-1 bg-rule" />
              <span className="label text-spot">Selected work</span>
            </div>
            <Reveal
              as="h2"
              split="chars"
              className="font-display font-black text-display-md text-ink"
            >
              Platforms
            </Reveal>
          </div>

          {/* Horizontal track (stacks vertically under lg) */}
          <div className="lg:flex-1 lg:flex lg:items-center lg:overflow-hidden mt-14 lg:mt-6">
            <div
              ref={trackRef}
              className="flex flex-col lg:flex-row gap-16 lg:gap-10 px-6 md:px-12 lg:pl-[max(3rem,calc((100vw-1440px)/2+3rem))] lg:pr-[30vw] w-full lg:w-max"
            >
              {PROJECTS.map((project) => (
                <article
                  key={project.key}
                  className="work-panel group relative w-full lg:w-[46vw] xl:w-[42vw] shrink-0"
                >
                  <button
                    onClick={() => open(project.key)}
                    className="block w-full text-left"
                    data-cursor="active"
                    data-cursor-text="OPEN"
                    aria-label={`${project.title} — ${project.cta}`}
                  >
                    {/* Plate: hairline frame, no rounding. These are screenshots
                        of dark interfaces, so on paper they need contrast and a
                        border or they read as grey slabs. */}
                    <div className="relative overflow-hidden border border-ink/25 aspect-[16/10] bg-paper-deep">
                      <img
                        alt={`${project.title} interface`}
                        loading="lazy"
                        className="work-image absolute inset-0 w-full h-full object-cover grayscale contrast-[1.35] brightness-105 group-hover:grayscale-0 group-hover:contrast-100 transition-[filter] duration-700 will-change-transform"
                        src={project.image}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </button>

                  {/* Plate caption, set below the image as it would be in print. */}
                  <div className="flex items-baseline gap-3 pt-3 border-t border-rule mt-3">
                    <span className="folio">{project.index}</span>
                    <span className="label text-ink-faint">{project.status}</span>
                  </div>

                  <div className="pt-6">
                    <p className="label text-spot mb-4">{project.discipline}</p>
                    <h3 className="font-display font-bold text-[clamp(2rem,4vw,3.5rem)] tracking-tight text-ink mb-4 leading-none">
                      {project.title}
                    </h3>
                    <p className="font-body text-sm md:text-base text-ink-soft font-light leading-relaxed max-w-lg mb-7 text-pretty">
                      {project.summary}
                    </p>

                    <div className="flex items-center justify-between gap-6 border-t border-rule pt-5">
                      <Magnetic strength={0.25}>
                        <button
                          onClick={() => open(project.key)}
                          className="text-[11px] uppercase tracking-[0.2em] text-ink hover:text-spot transition-colors duration-500 inline-flex items-center gap-2 whitespace-nowrap link-underline"
                          data-cursor="active"
                        >
                          {project.cta}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </Magnetic>
                      <span className="label text-ink-faint">{project.stack}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Horizontal progress rail — orientation cue for a non-standard scroll axis */}
          <div className="hidden lg:block max-w-[1440px] w-full mx-auto px-12 pb-10 shrink-0">
            <div className="flex items-center gap-5">
              <span className="label text-ink-faint whitespace-nowrap">Drag / scroll</span>
              <div className="h-px flex-1 bg-rule overflow-hidden">
                <div ref={progressRef} className="h-full w-full bg-spot origin-left scale-x-0" />
              </div>
              <span className="label text-ink-faint">03</span>
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
