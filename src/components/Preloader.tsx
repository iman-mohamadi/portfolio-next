import React, { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

const BOOT_LINES = [
  'Initializing neural link',
  'Loading memory sectors',
  'Scanning mesh topology',
  'Decrypting asset cache',
  'Calibrating optics',
  'System online',
];

const COLUMNS = 6;

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * First impression and the load budget's cover. Runs a real readiness check
 * (fonts + hero imagery) behind a minimum on-screen duration, then wipes away
 * in columns and hands control to the hero timeline.
 */
export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        setGone(true);
        onComplete();
      };

      if (reduced) {
        finish();
        return;
      }

      const counter = { value: 0 };
      const paint = () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0');
        }
      };

      // Real readiness: webfonts settled and the hero portrait decoded. Racing a
      // ceiling means a cold cache never strands the visitor on the loader.
      const ready = Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.querySelectorAll<HTMLImageElement>('img[data-preload]')).map(
            (img) => img.decode().catch(() => undefined)
          ),
        ]),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);

      const tl = gsap.timeline();

      tl.set('.preloader-col', { yPercent: 0 })
        .from('.preloader-meta', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 })
        // Climb to 92 while assets stream, so the number is never lying about progress.
        .to(
          counter,
          { value: 92, duration: 1.9, ease: 'power2.inOut', onUpdate: paint },
          0
        )
        .to(barRef.current, { scaleX: 0.92, duration: 1.9, ease: 'power2.inOut' }, 0)
        .to(
          '.boot-line',
          {
            opacity: 1,
            duration: 0.01,
            stagger: { each: 1.9 / BOOT_LINES.length },
          },
          0
        );

      tl.call(() => {
        ready.then(() => {
          const out = gsap.timeline({ onComplete: finish });

          out
            .to(counter, { value: 100, duration: 0.5, ease: 'power2.out', onUpdate: paint })
            .to(barRef.current, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, '<')
            .to('.preloader-meta', { opacity: 0, y: -12, duration: 0.5, stagger: 0.04 }, '+=0.15')
            // Columns lift in sequence — the reveal reads as a structure being
            // raised rather than a fade.
            .to(
              '.preloader-col',
              {
                yPercent: -100,
                duration: 1.15,
                ease: 'archInOut',
                stagger: 0.07,
              },
              '-=0.2'
            );
        });
      });

      // Safety net on a wall clock rather than the animation clock. GSAP's
      // ticker rides requestAnimationFrame, which browsers throttle or suspend
      // entirely for background tabs — without this, someone who opens the site
      // in a background tab and comes back later finds a loader frozen at 000.
      const failsafe = window.setTimeout(finish, 9000);

      return () => {
        window.clearTimeout(failsafe);
        tl.kill();
      };
    },
    { scope: rootRef, dependencies: [reduced] }
  );

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999]"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      {/* Wipe columns */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: COLUMNS }).map((_, i) => (
          <div key={i} className="preloader-col flex-1 bg-paper" />
        ))}
      </div>

      {/* Readout */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
        <div className="preloader-meta label text-ink-faint">Iman Mohammadi — Portfolio</div>

        <div className="flex items-end justify-between gap-8">
          <div className="preloader-meta">
            <div className="font-display font-extrabold text-display-lg text-ink leading-none">
              <span ref={counterRef}>000</span>
              <span className="text-neon">%</span>
            </div>
          </div>

          <div className="preloader-meta hidden sm:block text-right">
            {BOOT_LINES.map((line) => (
              <div key={line} className="boot-line label text-ink-faint opacity-0 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Progress rule */}
        <div className="preloader-meta w-full h-px bg-rule mt-8 overflow-hidden">
          <div ref={barRef} className="h-full w-full bg-neon origin-left scale-x-0" style={{ boxShadow: '0 0 8px var(--color-neon), 0 0 20px rgba(255,122,30,0.4)' }} />
        </div>
      </div>
    </div>
  );
};
