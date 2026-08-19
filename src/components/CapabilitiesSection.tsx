import React, { useMemo, useRef, useState } from 'react';
import { Code2 } from 'lucide-react';
import { CapabilityItem } from '../types';
import { gsap, useGSAP } from '../lib/gsap';
import { Reveal } from './motion/Reveal';
import { Counter } from './motion/Counter';
import { useReducedMotion } from '../hooks/useReducedMotion';

const capabilities: CapabilityItem[] = [
  {
    id: 'react-next',
    number: '01',
    title: 'React / Next.js',
    description:
      'Server-side rendering, advanced state management, and edge-deployed micro-frontends.',
    category: 'FRONTEND ARCHITECTURE',
    stats: { projects: 28, latencyAverage: '< 45ms TTFB', uptimeScore: '99.99%' },
    technologies: [
      'Next.js App Router',
      'React Server Components',
      'Zustand / Redux',
      'Module Federation',
      'Turbopack',
    ],
  },
  {
    id: 'vue-nuxt',
    number: '02',
    title: 'Vue / Nuxt 3',
    description:
      'High-performance reactive interfaces, composition API mastery, and static site generation.',
    category: 'REACTIVE SYSTEMS',
    stats: { projects: 19, latencyAverage: '< 38ms TTFB', uptimeScore: '99.98%' },
    technologies: [
      'Nuxt 3 Nitro Engine',
      'Pinia Store',
      'VueUse Utilities',
      'Vite Plugin Ecosystem',
      'Universal Rendering',
    ],
  },
  {
    id: 'webgl-three',
    number: '03',
    title: 'WebGL / Three.js',
    description:
      'Custom shaders, parametric geometries, and interactive cinematic web environments.',
    category: 'SPATIAL & SHADERS',
    stats: { projects: 14, latencyAverage: '60 FPS Fixed', uptimeScore: 'GPU Optimized' },
    technologies: [
      'GLSL Shaders',
      'Three.js / React Three Fiber',
      'Post-processing Pipeline',
      'Instanced Meshes',
      'WebGPU Ready',
    ],
  },
  {
    id: 'backend',
    number: '04',
    title: 'Node / Python',
    description:
      'REST/GraphQL APIs, real-time data streaming, and scalable microservice architectures.',
    category: 'DISTRIBUTED SERVICES',
    stats: { projects: 32, latencyAverage: '< 12ms P95', uptimeScore: '99.995%' },
    technologies: [
      'Node.js Cluster',
      'FastAPI Python',
      'GraphQL Apollo',
      'Redis Caching',
      'Docker / Kubernetes',
      'gRPC',
    ],
  },
];

const WEEKS = 48;

export const CapabilitiesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<{ count: number; date: string } | null>(null);
  const reduced = useReducedMotion();

  const cadenceMatrix = useMemo(() => {
    const today = new Date();
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const cellDate = new Date(today);
        cellDate.setDate(cellDate.getDate() - ((WEEKS - 1 - w) * 7 + (6 - d)));

        const rand = Math.random();
        const isWeekend = d === 0 || d === 6;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        let count = 0;

        if (isWeekend) {
          if (rand > 0.6) {
            level = rand > 0.9 ? 2 : 1;
            count = Math.floor(rand * 5) + 1;
          }
        } else if (rand > 0.15) {
          if (rand > 0.85) [level, count] = [4, Math.floor(Math.random() * 8) + 12];
          else if (rand > 0.6) [level, count] = [3, Math.floor(Math.random() * 5) + 7];
          else if (rand > 0.35) [level, count] = [2, Math.floor(Math.random() * 4) + 3];
          else [level, count] = [1, Math.floor(Math.random() * 2) + 1];
        }

        return {
          level,
          count,
          date: cellDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      })
    );
  }, []);

  const totalCommits = useMemo(
    () => cadenceMatrix.flat().reduce((sum, cell) => sum + cell.count, 0),
    [cadenceMatrix]
  );

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.cap-card', {
        yPercent: 14,
        opacity: 0,
        duration: 1.1,
        stagger: 0.09,
        scrollTrigger: { trigger: '.cap-grid', start: 'top 80%', once: true },
      });

      // The matrix builds column by column as it enters — it reads as data
      // being written rather than a static image.
      gsap.from('.cadence-col', {
        scaleY: 0,
        opacity: 0,
        transformOrigin: 'bottom center',
        duration: 0.6,
        stagger: 0.008,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.cadence-matrix', start: 'top 88%', once: true },
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="capabilities"
      aria-label="Capabilities"
      className="relative z-20 bg-paper py-24 md:py-40 px-6 md:px-12 border-t border-rule"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <span className="label text-ink-faint">(03)</span>
          <span className="h-px flex-1 bg-rule" />
          <span className="label text-spot">Practice</span>
        </div>

        <Reveal
          as="h2"
          split="chars"
          className="font-display font-extrabold text-display-lg text-ink mb-16 md:mb-24"
        >
          CAPABILITIES
        </Reveal>

        {/* Capability cards */}
        <div className="cap-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-rule border border-rule mb-24">
          {capabilities.map((item) => {
            const isSelected = selectedCap === item.id;
            return (
              <div
                key={item.id}
                className={`cap-card group relative bg-paper p-7 lg:p-8 transition-colors duration-500 ${
                  isSelected ? 'bg-paper-deep' : 'hover:bg-paper-dim'
                }`}
              >
                <button
                  onClick={() => setSelectedCap(isSelected ? null : item.id)}
                  aria-expanded={isSelected}
                  aria-controls={`cap-detail-${item.id}`}
                  className="w-full text-left"
                  data-cursor="active"
                >
                  <div className="flex items-center justify-between mb-10">
                    <span className="text-xs text-ink-faint group-hover:text-spot tracking-widest transition-colors duration-500 font-semibold">
                      {item.number}
                    </span>
                    <span
                      className={`w-5 h-5 border border-rule flex items-center justify-center text-ink-soft text-sm leading-none transition-all duration-500 ${
                        isSelected ? 'rotate-45 border-spot text-spot' : 'group-hover:border-ink'
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-2xl lg:text-[1.75rem] text-ink mb-4 group-hover:text-spot transition-colors duration-500 leading-tight">
                    {item.title}
                  </h3>

                  <p className="font-body text-sm text-ink-soft font-light leading-relaxed mb-7 text-pretty">
                    {item.description}
                  </p>
                </button>

                <div className="flex flex-wrap gap-1.5 pt-5 border-t border-rule">
                  {item.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] text-ink-faint bg-paper-dim border border-rule px-2 py-0.5"
                    >
                      {tech}
                    </span>
                  ))}
                  {item.technologies.length > 3 && (
                    <span className="text-[10px] text-spot px-1.5 py-0.5">
                      +{item.technologies.length - 3}
                    </span>
                  )}
                </div>

                <div
                  id={`cap-detail-${item.id}`}
                  hidden={!isSelected}
                  className="mt-6 pt-5 border-t border-spot/20 space-y-2.5 text-xs"
                >
                  <div className="flex justify-between text-ink-soft">
                    <span>Deployments</span>
                    <span className="text-spot">{item.stats.projects} apps</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>Benchmark</span>
                    <span className="text-spot">{item.stats.latencyAverage}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>Reliability</span>
                    <span className="text-spot">{item.stats.uptimeScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cadence matrix + headline figures */}
        <div className="pt-14 border-t border-rule flex flex-col xl:flex-row justify-between items-start xl:items-end gap-14">
          <div className="w-full xl:w-auto cadence-matrix">
            <div className="flex items-baseline justify-between gap-6 mb-2">
              <h3 className="font-display font-medium text-lg text-ink flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-spot" aria-hidden="true" /> Engineering cadence
              </h3>
              <span className="text-[11px] text-spot tracking-wider">
                <Counter to={totalCommits} /> COMMITS / 12 MO
              </span>
            </div>
            <p className="label text-ink-faint mb-5">Twelve-month contribution density</p>

            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[3px] min-w-[520px]">
                {cadenceMatrix.map((week, wIdx) => (
                  <div key={wIdx} className="cadence-col flex flex-col gap-[3px]">
                    {week.map((cell, dIdx) => {
                      const bg =
                        cell.level === 4
                          ? 'bg-spot shadow-[0_0_6px_rgba(0,240,255,0.55)]'
                          : cell.level === 3
                            ? 'bg-spot'
                            : cell.level === 2
                              ? 'bg-spot/40'
                              : cell.level === 1
                                ? 'bg-spot/25'
                                : 'bg-paper-deep';
                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setActiveCell(cell)}
                          onMouseLeave={() => setActiveCell(null)}
                          className={`w-2.5 h-2.5 ${bg} transition-transform duration-300 hover:scale-150`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-5 mt-3 text-[10px]" aria-live="polite">
              {activeCell ? (
                <span className="text-spot">
                  &gt; {activeCell.date} — {activeCell.count} contributions
                </span>
              ) : (
                <span className="text-ink-faint">&gt; Hover a node for detail</span>
              )}
            </div>
          </div>

          <dl className="flex gap-12 md:gap-20">
            <div className="border-l border-rule pl-6">
              <dt className="label text-ink-faint mb-2">Experience</dt>
              <dd className="font-display font-bold text-5xl text-ink">
                <Counter to={9} />+ <span className="text-xl text-spot">YRS</span>
              </dd>
            </div>
            <div className="border-l border-rule pl-6">
              <dt className="label text-ink-faint mb-2">Role</dt>
              <dd className="font-display font-semibold text-4xl text-ink">Architect</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};
