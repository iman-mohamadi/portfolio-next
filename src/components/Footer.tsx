import React, { useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import { Magnetic } from './motion/Magnetic';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'GitHub', href: 'https://github.com' },
];

export const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      // The wordmark rises out of the page edge as the footer arrives —
      // the last beat of the scroll, and the site's sign-off.
      gsap.from('.footer-wordmark', {
        yPercent: 40,
        opacity: 0,
        duration: 1.4,
        scrollTrigger: { trigger: footerRef.current, start: 'top 92%', once: true },
      });
    },
    { scope: footerRef, dependencies: [reduced] }
  );

  return (
    <footer
      ref={footerRef}
      className="relative z-20 bg-paper border-t border-rule pt-16 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-14">
          <div>
            <p className="label text-ink-faint mb-4">Available for 2026</p>
            <p className="font-display font-semibold text-2xl md:text-3xl text-ink max-w-sm leading-snug text-balance">
              Have a system that needs structure?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            {SOCIALS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-ink-faint hover:text-spot transition-colors duration-500 uppercase tracking-widest link-underline"
                data-cursor="active"
              >
                {label}
              </a>
            ))}

            <Magnetic strength={0.35}>
              <button
                onClick={() => scrollTo('#hero')}
                className="w-11 h-11 rounded-full border border-rule hover:border-spot hover:text-spot text-ink flex items-center justify-center transition-colors duration-500"
                aria-label="Back to top"
                data-cursor="active"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </button>
            </Magnetic>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 py-6 border-t border-rule label text-ink-faint">
          <span className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 bg-spot rounded-full" aria-hidden="true" />
            © {new Date().getFullYear()} Iman Mohammadi
          </span>
          <span>Set in Playfair Display &amp; Public Sans</span>
        </div>
      </div>

      {/* Oversized wordmark, clipped by the page edge */}
      <div
        className="footer-wordmark font-display font-black text-ink/[0.07] leading-[0.72] select-none pointer-events-none text-center whitespace-nowrap"
        style={{ fontSize: 'clamp(2.5rem, 16vw, 16rem)' }}
        aria-hidden="true"
      >
        ARCHITECT
      </div>
    </footer>
  );
};
