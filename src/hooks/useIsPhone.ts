import { useEffect, useState } from 'react';
import { isPhoneViewport } from '../lib/motion';

/**
 * Live phone-viewport check.
 *
 * Phones skip the WebGL hero entirely — that is ~190 kB gzip of renderer and a
 * continuous GPU load saved on the devices least able to afford either. The
 * hero draws a CSS stand-in for the 3D object instead, so the composition still
 * holds. Anything that gates on the canvas must read this same hook, or the two
 * decisions drift and the hero renders empty.
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
