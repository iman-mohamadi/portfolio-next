import { useEffect } from 'react';
import { playSfx } from '../utils/audioSynth';

const INTERACTIVE = 'a[href], button, [data-cursor], input, textarea, select';

/**
 * Attaches interface sounds globally rather than per-component, so every
 * control is covered without threading a sound prop through the whole tree.
 * Only listens while audio is enabled.
 */
export function useUiSounds(active: boolean) {
  useEffect(() => {
    if (!active) return;

    let lastTarget: Element | null = null;

    const onPointerOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(INTERACTIVE) ?? null;
      // pointerover bubbles from every descendant; only sound the transition
      // between distinct controls.
      if (!target || target === lastTarget) {
        lastTarget = target;
        return;
      }
      lastTarget = target;
      playSfx('hover');
    };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.(INTERACTIVE)) playSfx('click');
    };

    window.addEventListener('pointerover', onPointerOver, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [active]);
}
