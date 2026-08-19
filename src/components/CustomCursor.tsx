import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { isTouch } from '../lib/motion';

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, [data-cursor], .interactive-card';

/**
 * Two-part cursor: a dot locked to the pointer and a ring that trails it.
 *
 * Everything runs through GSAP quickTo against the DOM directly — the previous
 * implementation set React state on every mousemove, which re-rendered the tree
 * at pointer frequency.
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label || reduced || isTouch()) return;

    document.documentElement.classList.add('has-custom-cursor');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    // The ring's longer duration is the whole effect: it lags, then catches up.
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(INTERACTIVE_SELECTOR);
      const text = target?.getAttribute('data-cursor-text') ?? '';

      gsap.to(ring, {
        scale: target ? (text ? 2.6 : 1.9) : 1,
        borderColor: target ? 'rgba(193,68,14,0.9)' : 'rgba(20,17,15,0.4)',
        backgroundColor: target ? 'rgba(193,68,14,0.08)' : 'rgba(0,0,0,0)',
        duration: 0.45,
        ease: 'lift',
      });
      gsap.to(dot, { scale: target ? 0 : 1, duration: 0.35, ease: 'lift' });

      label.textContent = text;
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25 });
    };

    const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.2, ease: 'lift' });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.35, ease: 'lift' });
    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      <div
        ref={ringRef}
        className="absolute top-0 left-0 w-10 h-10 rounded-full border border-ink/40 flex items-center justify-center opacity-0 will-change-transform"
      >
        <span
          ref={labelRef}
          className="text-[7px] tracking-[0.2em] text-spot uppercase opacity-0 whitespace-nowrap"
        />
      </div>
      <div
        ref={dotRef}
        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-ink opacity-0 will-change-transform"
      />
    </div>
  );
};
