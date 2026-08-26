import { useSyncExternalStore } from 'react';
import { hasWebGL, isPhoneViewport, prefersReducedMotion, REDUCED_MOTION_QUERY } from '../lib/motion';

/**
 * Whether the WebGL hero should mount at all.
 *
 * This is the one source of truth for that question, because two separate
 * components need the same answer and they must not disagree: `App` uses it to
 * decide whether to fetch the renderer, and `HeroSection` uses it to decide
 * whether to render the wordmark in the DOM. If they drift, the visitor either
 * sees the wordmark twice or does not see it at all — and "not at all" is the
 * failure that ships, because it only happens on the machines the author is
 * least likely to be testing on.
 *
 * WebGL support is probed once and cached; it cannot change within a session,
 * and the probe itself costs a context. Viewport and reduced-motion are live.
 */

let webglSupport: boolean | null = null;
const supportsWebGL = () => (webglSupport ??= hasWebGL());

const PHONE_QUERY = '(max-width: 767px)';

function subscribe(onChange: () => void): () => void {
  const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
  const phone = window.matchMedia(PHONE_QUERY);
  reduced.addEventListener('change', onChange);
  phone.addEventListener('change', onChange);
  return () => {
    reduced.removeEventListener('change', onChange);
    phone.removeEventListener('change', onChange);
  };
}

const getSnapshot = () =>
  !isPhoneViewport() && !prefersReducedMotion() && supportsWebGL();

export function useLensEligible(): boolean {
  // Server snapshot is false: render the DOM wordmark, then upgrade. The
  // reverse order would flash the mark twice.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
