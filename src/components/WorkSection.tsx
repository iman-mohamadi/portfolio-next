import React, {
  Suspense,
  forwardRef,
  lazy,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
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
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const PROJECTS: WorkProject[] = [
  {
    key: 'raya',
    title: 'Raya UI',
    subtitle: 'Open design system',
    description:
      'An open component library and design system — tokenised primitives, a documentation site, and a CLI that scaffolds components straight into a project. Published to npm and versioned so consuming apps can upgrade on their own schedule.',
    image: '/work-raya.jpg',
  },
  {
    key: 'hotelyar',
    title: 'Hotelyar',
    subtitle: 'Reservation platform',
    description:
      'A reservation platform where server rendering and cache strategy decide the experience. Route-level data loading, aggressive edge caching, and a render path tuned so every millisecond of TTFB stays visible in the funnel.',
    image: '/work-hotelyar.jpg',
  },
  {
    key: 'woodcoder',
    title: 'Woodcoder',
    subtitle: 'Parametric configurator',
    description:
      'A parametric configurator running in the browser: geometry rebuilt live from the parameters, custom material shaders, and instanced draw calls that keep the frame budget intact on integrated graphics.',
    image: '/work-woodcoder.jpg',
  },
];

/** Reveal grid. Block width sets the row height so the steps stay square-ish. */
const COLS = 12;
const ROWS = 8;

interface PlateHandle {
  /** 0 hidden, 1 fully revealed. */
  setProgress: (progress: number) => void;
}

interface PlateProps {
  project: WorkProject;
  /** Resting progress, applied on mount before any scroll drives it. */
  initial: number;
  offsets: number[];
}

/**
 * One project image revealed by the site's block wipe.
 *
 * Each column is a full-height slice of the same image, clipped from the top.
 * Clipping rather than resizing a wrapper matters: the picture has to stay
 * fixed in the frame while the blocks climb over it, and any approach that
 * anchors the image to the growing column drags it upward as it reveals.
 *
 * Progress is written imperatively through the handle rather than passed as a
 * prop: it changes on every scroll tick while the reel is pinned, and a React
 * render of three plates times twelve columns per frame was the single biggest
 * source of scroll jank on the page. The snap to whole blocks also means most
 * ticks change nothing for a given column, so writes are skipped entirely.
 */
const Plate = forwardRef<PlateHandle, PlateProps>(({ project, initial, offsets }, ref) => {
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastH = useRef<number[]>([]);

  const apply = useCallback(
    (progress: number) => {
      const span = 1 - Math.max(...offsets);
      for (let i = 0; i < COLS; i += 1) {
        const el = colRefs.current[i];
        if (!el) continue;
        const local = Math.min(1, Math.max(0, (progress - offsets[i]) / span));
        const h = Math.ceil(local * ROWS) / ROWS;
        if (lastH.current[i] === h) continue;
        lastH.current[i] = h;
        el.style.clipPath = `inset(${(1 - h) * 100}% 0 0 0)`;
      }
    },
    [offsets]
  );

  useImperativeHandle(ref, () => ({ setProgress: apply }), [apply]);

  useEffect(() => {
    apply(initial);
    // The resting state only matters until the ScrollTrigger takes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: COLS }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            colRefs.current[i] = el;
          }}
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{
            left: `${(i / COLS) * 100}%`,
            // Hairline overlap: sub-pixel column gaps otherwise show the
            // outgoing image as vertical seams.
            width: `calc(${100 / COLS}% + 1px)`,
            clipPath: 'inset(100% 0 0 0)',
          }}
        >
          <div
            className="absolute top-0 h-full"
            style={{ left: `-${i * 100}%`, width: `${COLS * 100}%` }}
          >
            <img
              src={project.image}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
});
Plate.displayName = 'Plate';

/**
 * Selected work as a pinned reel: the heading holds at the top while the
 * projects advance beneath it, each one wiped in over the last with the same
 * block transition the section grounds use. The ordinal rolls vertically in
 * step, so the number and the plate always agree.
 *
 * Under `lg`, or with reduced motion, the pin is dropped and the projects
 * simply stack — a scroll-jacked reel with no pointer is worse than a list.
 */
export const WorkSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [openModal, setOpenModal] = useState<ProjectKey | null>(null);
  // Once a modal has been opened it stays mounted, so its close animation can
  // finish and reopening is instant.
  const [mounted, setMounted] = useState<ProjectKey[]>([]);
  const reduced = useReducedMotion();

  // Stable per-column head start, shared by every transition in the section.
  const offsets = useRef<number[]>(
    Array.from({ length: COLS }, () => Math.random() * 0.32)
  ).current;

  // Written imperatively from the ScrollTrigger — never React state.
  const plateRefs = useRef<(PlateHandle | null)[]>([]);
  const activeRef = useRef(0);

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
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
      });

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const section = sectionRef.current;
        if (!section) return;

        const steps = PROJECTS.length - 1;

        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * steps * 1.15}`,
          pin: true,
          // Smoothed like the Tools track: raw `scrub: true` steps with each
          // wheel notch, where the reference's wipes glide and settle.
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Same reason as the Tools pin: this spacer moves every later
          // section, so it has to be measured before anything reading their
          // positions — ScrollBackdrop most of all.
          refreshPriority: 1,
          onUpdate: (self) => {
            const pos = self.progress * steps;
            const idx = Math.min(steps, Math.floor(pos));
            const local = pos - idx;

            plateRefs.current.forEach((plate, i) => {
              if (!plate) return;
              plate.setProgress(i <= idx ? 1 : i === idx + 1 ? local : 0);
            });

            // The meta column is the only React consumer, and it only needs a
            // render when the active project actually flips.
            const next = local > 0.5 ? Math.min(steps, idx + 1) : idx;
            if (next !== activeRef.current) {
              activeRef.current = next;
              setActive(next);
            }

            if (numberRef.current) {
              gsap.set(numberRef.current, { yPercent: -(pos / PROJECTS.length) * 100 });
            }
          },
        });

        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  const current = PROJECTS[active];

  return (
    <>
      <section
        ref={sectionRef}
        id="work"
        aria-label="Selected work"
        className="relative z-20 lg:h-[100svh] lg:overflow-hidden py-20 lg:py-0 lg:flex lg:flex-col lg:justify-center"
      >
        <div className="px-6 md:px-10 lg:px-0 shrink-0">
          <h2 className="display text-[clamp(3rem,11vw,10rem)] text-ink text-center leading-[0.82]">
            <span className="split-line-mask block">
              <span className="work-line block">Work</span>
            </span>
          </h2>
        </div>

        {/* Desktop reel */}
        <div className="hidden lg:block border-y border-ink/35 mt-10">
          <div className="grid grid-cols-12 items-stretch min-h-[58svh]">
            {/* Ordinal + action */}
            <div className="col-span-3 relative flex flex-col justify-between p-6 border-r border-ink/35">
              <div className="h-[clamp(4rem,9vw,7.5rem)] overflow-hidden">
                <div ref={numberRef} className="will-change-transform">
                  {PROJECTS.map((p, i) => (
                    <div
                      key={p.key}
                      className="h-[clamp(4rem,9vw,7.5rem)] flex items-start font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-none text-ink"
                      style={{ fontVariationSettings: "'wdth' 100, 'wght' 300" }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => open(current.key)}
                className="btn-box self-start"
                data-cursor="active"
              >
                <EncryptedText text="View project" />
              </button>
            </div>

            {/* Plate — every project stacked, wiped in over the last */}
            <div className="col-span-6 relative bg-paper-deep overflow-hidden">
              {PROJECTS.map((p, i) => (
                <div key={p.key} className="absolute inset-0" style={{ zIndex: i + 1 }}>
                  <Plate
                    ref={(h) => {
                      plateRefs.current[i] = h;
                    }}
                    project={p}
                    initial={i === 0 ? 1 : 0}
                    offsets={offsets}
                  />
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="col-span-3 relative flex flex-col justify-between p-6 border-l border-ink/35">
              <div aria-live="polite">
                <p className="label text-ink">{current.title}</p>
                <p className="label text-ink-faint">{current.subtitle}</p>
              </div>
              <p className="label text-ink-soft leading-relaxed max-w-[26rem]">
                {current.description}
              </p>
            </div>
          </div>
        </div>

        {/* Stacked list under lg, and the accessible version of the reel */}
        <ul className="lg:hidden mt-12 px-6 md:px-10 space-y-14">
          {PROJECTS.map((p, i) => (
            <li key={p.key}>
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <span className="font-display text-4xl text-ink leading-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="label text-ink-faint text-right">{p.subtitle}</span>
              </div>

              <div className="aspect-[4/3] border border-ink/25 bg-paper-deep overflow-hidden">
                <img
                  src={p.image}
                  alt={`${p.title} interface`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="display text-[clamp(1.75rem,7vw,2.75rem)] text-ink mt-5">
                {p.title}
              </h3>
              <p className="label text-ink-soft leading-relaxed mt-3">{p.description}</p>

              <button onClick={() => open(p.key)} className="btn-box mt-6" data-cursor="active">
                <EncryptedText text="View project" />
              </button>
            </li>
          ))}
        </ul>
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
