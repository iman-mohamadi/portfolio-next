import React, { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type RevealElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';

interface RevealProps {
  children: React.ReactNode;
  /** Rendered tag — keep headings semantic. */
  as?: RevealElement;
  /** Granularity of the split. `chars` is expensive; reserve it for short display type. */
  split?: 'lines' | 'words' | 'chars';
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  /** ScrollTrigger start. Pass `immediate` to play on mount instead. */
  start?: string;
  immediate?: boolean;
  id?: string;
}

/**
 * Masked split-text reveal. Each line/word/char rises out of its own overflow
 * mask — the single most recognisable "award-site" typographic move, and the
 * reason the copy reads as choreographed rather than faded-in.
 *
 * Degrades to plain visible text under `prefers-reduced-motion`.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  as: Tag = 'div',
  split = 'lines',
  className = '',
  delay = 0,
  duration = 1.1,
  stagger = 0.09,
  start = 'top 85%',
  immediate = false,
  id,
}) => {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      let splitter: SplitText | null = null;
      let cancelled = false;
      const granularity: 'lines' | 'words' | 'chars' = split;

      // Splitting before webfonts settle measures the fallback face and produces
      // wrong line breaks, so always wait for the real metrics.
      document.fonts.ready.then(() => {
        if (cancelled || !ref.current) return;

        splitter = SplitText.create(ref.current, {
          type: granularity,
          mask: granularity,
          autoSplit: true,
          linesClass: 'reveal-line',
          wordsClass: 'reveal-word',
          charsClass: 'reveal-char',
        });

        const targets =
          split === 'chars' ? splitter.chars : split === 'words' ? splitter.words : splitter.lines;

        ref.current.classList.remove('reveal-pending');

        gsap.from(targets, {
          yPercent: 118,
          rotate: split === 'chars' ? 4 : 2,
          duration,
          delay,
          stagger: split === 'chars' ? stagger * 0.35 : stagger,
          ease: 'arch',
          ...(immediate
            ? {}
            : {
                scrollTrigger: {
                  trigger: ref.current,
                  start,
                  once: true,
                },
              }),
        });
      });

      return () => {
        cancelled = true;
        splitter?.revert();
      };
    },
    { scope: ref, dependencies: [reduced, split] }
  );

  return React.createElement(
    Tag,
    {
      ref: ref as React.Ref<never>,
      id,
      className: `${className} ${reduced ? '' : 'reveal-pending'}`.trim(),
    },
    children
  );
};
