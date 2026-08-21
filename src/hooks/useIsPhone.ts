import { useEffect, useState } from 'react';
import { isPhoneViewport } from '../lib/motion';

/**
 * Live phone-viewport check.
 *
 * The hero's particle wordmark is deliberately NOT used at this size. The
 * glyphs are sampled at a fixed world width and then scaled down to fit a
 * narrow screen, but `gl_PointSize` does not scale with the group — so the dots
 * stay the same size while the letterforms shrink, and the name collapses into
 * an illegible blob. Phones get real type instead, and skip loading Three.js
 * altogether.
 */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(isPhoneViewport);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setPhone(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return phone;
}
