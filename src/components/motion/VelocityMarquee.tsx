import React, { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { useSmoothScroll } from '../../providers/SmoothScrollProvider';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { clamp, damp } from '../../lib/motion';

interface VelocityMarqueeProps {
  items: string[];
  /** Baseline drift speed in px/s. Negative drifts right. */
  baseSpeed?: number;
  className?: string;
  separator?: React.ReactNode;
}

/**
 * Infinite marquee whose speed, direction and skew are driven by scroll
 * velocity: scrolling down accelerates it, scrolling up flips it, and stopping
 * lets it settle back to a slow drift. The skew sells the inertia.
 */
export const VelocityMarquee: React.FC<VelocityMarqueeProps> = ({
  items,
  baseSpeed = 60,
  className = '',
  separator,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { velocityRef } = useSmoothScroll();
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const track = trackRef.current;
      const wrap = wrapRef.current;
      if (!track || !wrap || reduced) return;

      // Track holds two identical copies; wrapping at -50% is seamless.
      const setX = gsap.quickSetter(track, 'xPercent');
      const setSkew = gsap.quickSetter(track, 'skewX', 'deg');

      let offset = 0;
      let smoothedVelocity = 0;
      let lastTime = performance.now();

      const tick = () => {
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        smoothedVelocity = damp(smoothedVelocity, velocityRef.current, 8, dt);

        const half = track.scrollWidth / 2;
        if (half > 0) {
          const pxPerSecond = baseSpeed + smoothedVelocity * 12;
          offset -= (pxPerSecond * dt) / half * 50;
          // Keep the offset in [-50, 0) so the two copies always cover the wrap.
          offset = ((offset % 50) - 50) % 50;
          setX(offset);
        }

        setSkew(clamp(smoothedVelocity * 0.35, -12, 12));
      };

      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: wrapRef, dependencies: [reduced, baseSpeed] }
  );

  const sep = separator ?? <span className="text-neon px-6 md:px-10">◆</span>;
  const copy = (
    <>
      {items.map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span>{item}</span>
          {sep}
        </span>
      ))}
    </>
  );

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`} aria-hidden="true">
      <div ref={trackRef} className="flex w-max will-change-transform">
        <div className="flex items-center">{copy}</div>
        <div className="flex items-center">{copy}</div>
      </div>
    </div>
  );
};
