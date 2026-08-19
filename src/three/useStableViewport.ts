import { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

/** Camera's resting distance from the origin. Must match HeroCanvas. */
export const CAMERA_REST_Z = 6.6;

export interface StableViewport {
  width: number;
  height: number;
}

/**
 * World-space extent at the camera's RESTING distance.
 *
 * R3F's own `viewport` is derived from where the camera currently is, and this
 * scene dollies the camera backwards as the hero scrolls away. Laying anything
 * out from that value is a trap: the numbers are only correct while the camera
 * happens to be at rest.
 *
 * The failure was not subtle. Scrolling down moved the camera back, which
 * inflates `viewport`; any re-render that happened while it was back — the
 * render-gate state flipping, or a theme change — recomputed the layout from
 * the inflated figures. The camera then returned, but nothing re-rendered, so
 * the wordmark and the portrait stayed permanently oversized and off-centre.
 *
 * Deriving from canvas pixel size and a fixed distance makes the layout depend
 * only on things that actually change when the layout should.
 */
export function useStableViewport(): StableViewport {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);

  return useMemo(() => {
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 50;
    const height = 2 * Math.tan((fov * Math.PI) / 360) * CAMERA_REST_Z;
    const aspect = size.height > 0 ? size.width / size.height : 1;
    return { width: height * aspect, height };
  }, [size.width, size.height, camera]);
}
