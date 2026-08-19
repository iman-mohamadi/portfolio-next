/** Shared motion utilities and environment probes. */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

export const isTouch = (): boolean =>
  typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent damping. Plain `lerp(a, b, 0.1)` per frame moves twice
 * as fast at 120fps as it does at 60fps; this keeps the feel identical.
 */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * Whether WebGL can actually be created. The hero's name lives in the 3D scene,
 * so the DOM needs to know to render a visible fallback headline when it can't.
 */
export const hasWebGL = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Coarse GPU capability tier, used to scale particle counts and postprocessing.
 * Cheap heuristic — deliberately no canvas probing on the critical path.
 */
export const perfTier = (): 'low' | 'mid' | 'high' => {
  if (typeof window === 'undefined') return 'mid';
  if (prefersReducedMotion()) return 'low';
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (isTouch() || cores <= 4 || mem <= 4) return 'low';
  if (cores <= 8) return 'mid';
  return 'high';
};
