import { useEffect, useState } from 'react';
import { REDUCED_MOTION_QUERY, prefersReducedMotion } from '../lib/motion';

/** Live-updating `prefers-reduced-motion`, so the OS toggle takes effect instantly. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
