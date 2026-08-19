import React, { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CounterProps {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/** Counts up to its value when scrolled into view. Renders the final value if motion is reduced. */
export const Counter: React.FC<CounterProps> = ({
  to,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 2,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const format = (n: number) =>
    `${prefix}${n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      const state = { value: 0 };
      gsap.to(state, {
        value: to,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = format(state.value);
        },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    },
    { scope: ref, dependencies: [to, reduced] }
  );

  return (
    <span ref={ref} className={className}>
      {format(reduced ? to : 0)}
    </span>
  );
};
