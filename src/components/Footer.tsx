import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { EncryptedText } from './motion/EncryptedText';

export const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      // The wordmark rises out of the page edge as the footer arrives — the
      // last beat of the scroll, and the site's sign-off.
      gsap.from('.footer-wordmark', {
        yPercent: 22,
        duration: 1.4,
        ease: 'arch',
        scrollTrigger: { trigger: footerRef.current, start: 'top 95%', once: true },
      });
    },
    { scope: footerRef, dependencies: [reduced] }
  );

  return (
    <footer ref={footerRef} className="relative z-20 bg-paper overflow-hidden">
      <div className="px-6 md:px-10 pt-10 pb-6 flex flex-col sm:flex-row justify-between gap-4 label text-ink-faint">
        <span>© {new Date().getFullYear()} Iman Mohammadi</span>
        <span>Set in Archivo &amp; JetBrains Mono</span>
        <button
          onClick={() => scrollTo('#hero')}
          className="text-left sm:text-right text-ink link-underline"
          data-cursor="active"
        >
          <EncryptedText text="Back to top ↑" />
        </button>
      </div>

      {/* Oversized wordmark, set to fill the page width. At this extended
          width the face runs ~0.6em per character, so the fourteen characters
          of the full name land near 8.4vw. */}
      <div className="split-line-mask px-2">
        <div
          className="footer-wordmark display text-ink text-[8.4vw] whitespace-nowrap select-none pointer-events-none translate-y-[0.14em]"
          aria-hidden="true"
        >
          Iman Mohammadi
        </div>
      </div>
    </footer>
  );
};
