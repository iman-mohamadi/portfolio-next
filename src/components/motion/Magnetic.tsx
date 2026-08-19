import React, { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { isTouch } from '../../lib/motion';

interface MagneticProps {
  children: React.ReactElement;
  /** How far the element travels toward the pointer, as a fraction of the offset. */
  strength?: number;
  /** Padding around the element that still counts as "near". */
  radius?: number;
}

/**
 * Pulls its child toward the pointer as the pointer approaches, then springs
 * back on leave. Applied to primary CTAs and nav controls, this is what makes
 * the interface feel physically responsive rather than merely hover-styled.
 *
 * Pointer-only: no-ops on touch and under reduced motion.
 */
export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.4, radius = 90 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced || isTouch()) return;

      // quickTo reuses one tween instead of allocating per mousemove.
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'lift' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'lift' });

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        if (
          Math.abs(dx) > rect.width / 2 + radius ||
          Math.abs(dy) > rect.height / 2 + radius
        ) {
          xTo(0);
          yTo(0);
          return;
        }

        xTo(dx * strength);
        yTo(dy * strength);
      };

      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      el.addEventListener('mouseleave', onLeave);

      return () => {
        window.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      };
    },
    { scope: ref, dependencies: [reduced, strength, radius] }
  );

  return (
    <div ref={ref} className="inline-flex will-change-transform">
      {children}
    </div>
  );
};
