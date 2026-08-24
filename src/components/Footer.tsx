import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { EncryptedText } from './motion/EncryptedText';
import { PixelRunner } from './tools/PixelRunner';
import { useIsPhone } from '../hooks/useIsPhone';

export const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const isPhone = useIsPhone();

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
    <footer ref={footerRef} className="bleed-spot relative z-20 overflow-hidden">
      <div className="px-6 md:px-10 pt-10 pb-6 flex flex-col sm:flex-row justify-between gap-4 label">
        <span>© {new Date().getFullYear()} Iman Mohammadi</span>
        <span>Set in Archivo &amp; JetBrains Mono</span>
        <button
          onClick={() => scrollTo('#hero')}
          className="text-left sm:text-right link-underline"
          data-cursor="active"
        >
          <EncryptedText text="Back to top ↑" />
        </button>
      </div>

      {/* Oversized wordmark with the sprite parked against it, clipped by the
          page edge. Slashed and shortened to the surname so it can be set
          large enough to fill the width alongside the runner. */}
      <div className="split-line-mask px-2">
        <div
          className="footer-wordmark flex items-end gap-[2vw] text-[#0a0a0a] select-none pointer-events-none translate-y-[0.14em]"
          aria-hidden="true"
        >
          {/* The sprite is sized in absolute pixels, so at a fixed scale it
              eats an eighth of a phone's width and towers over the wordmark's
              cap height. Step it down with the type. */}
          <PixelRunner scale={isPhone ? 3 : 5} className="mb-[2.2vw] shrink-0" />
          {/* Sized so the eleven glyphs clear the runner and the gutter — at
              12.5vw the trailing letter fell off the right edge. */}
          <span className="display text-[10.2vw] leading-[0.78] whitespace-nowrap">
            /Mohammadi
          </span>
        </div>
      </div>
    </footer>
  );
};
