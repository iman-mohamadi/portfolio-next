import type { MutableRefObject } from 'react';

/**
 * Normalised pointer position shared across the hero scene.
 *
 * `active` matters: x/y default to 0,0 which is the *centre* of the screen, so
 * anything that reacts to the pointer would otherwise behave as though the
 * cursor were parked dead centre before the visitor has moved it at all.
 */
export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export type PointerRef = MutableRefObject<PointerState>;
export type ScrollRef = MutableRefObject<number>;
