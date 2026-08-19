import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { getTheme, onThemeChange } from '../lib/theme';

export interface SceneColors {
  isDark: boolean;
  /** Figure colour — ink on paper, light on a dark ground. */
  ink: THREE.Color;
  /** Half-strength figure, for thinner marks and drifting motes. */
  inkMid: THREE.Color;
  /** The single accent. */
  spot: THREE.Color;
  /** Ground colour, for anything that needs to match the page. */
  ground: THREE.Color;
}

function read(varName: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return new THREE.Color(raw || fallback);
}

function snapshot(): SceneColors {
  return {
    isDark: getTheme() === 'dark',
    ink: read('--color-ink', '#14110f'),
    inkMid: read('--color-ink-soft', '#4a4540'),
    spot: read('--color-spot', '#c1440e'),
    ground: read('--color-paper', '#f2f0eb'),
  };
}

/**
 * Scene colours pulled straight from the CSS custom properties, so the WebGL
 * layer and the DOM can never drift out of step.
 *
 * Deliberately not React context: the R3F root is a separate reconciler and
 * does not inherit context from the app tree, so the theme is read from the
 * document and refreshed on the theme event instead.
 */
export function useThemeColors(): SceneColors {
  const [colors, setColors] = useState<SceneColors>(snapshot);

  useEffect(() => {
    // The variables belong to the new theme only after the attribute flips,
    // so re-read on the next frame rather than inside the event.
    return onThemeChange(() => requestAnimationFrame(() => setColors(snapshot())));
  }, []);

  return colors;
}
