import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LENS_FRAGMENT, LENS_VERTEX } from './shaders/lens';
import { bakeWordmark, type WordmarkLine } from './wordmarkTexture';
import { damp } from '../lib/motion';
import type { PointerRef, ScrollRef } from './types';

const LINES: WordmarkLine[] = [
  { text: 'CREATIVE', align: 0 },
  { text: 'ENGINEER', align: 1 },
];

/** Reads a colour token off the document so GLSL and CSS cannot drift apart. */
function token(name: string, fallback: string): THREE.Color {
  const raw =
    typeof window === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || fallback);
}

interface LensFieldProps {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
  quality: 'low' | 'mid' | 'high';
}

/**
 * The hero. One quad, one texture, one draw call.
 *
 * Uniforms are reached through the material ref and never through the object
 * passed to `<shaderMaterial uniforms={...}>` — that object is cloned during
 * construction, so mutating the local copy updates nothing, and rebuilding it
 * rebuilds the material and resets every ramp to zero.
 */
export function LensField({ scrollRef, pointerRef, quality }: LensFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  // Damped pointer, kept out of React entirely.
  const pointer = useRef({ x: 0, y: 0 });

  // Read from the document so the scene cannot drift from the stylesheet.
  //
  // The two dispersion fringes have to be complements or the effect reads as a
  // glitch rather than as glass. `spot` is the site's vermilion, so the
  // opposite edge is its complement in teal — it is the only colour here not
  // taken from a token, and it exists solely to be the other end of a split.
  const colours = useMemo(
    () => ({
      lumen: token('--color-ink', '#eceae4'),
      beam: token('--color-neon', '#ff7a1e'),
      // The slab's own body: a warm near-black lifted just off the ground.
      ultra: token('--color-paper-deep', '#1f1f1c'),
      spill: new THREE.Color('#3fb0c8'),
    }),
    []
  );

  // Bake after fonts settle. Baking before `document.fonts.ready` resolves
  // permanently burns the fallback face into the texture — nothing re-renders
  // this on font load, so there is no recovery.
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    let cancelled = false;

    const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5);
    const padding = size.width < 768 ? 24 : 40;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      const baked = bakeWordmark(LINES, {
        width: size.width,
        height: size.height,
        dpr,
        padding,
        // Clears the fixed nav bar (py-4 + label line-height ≈ 56px) with a
        // little air. The DOM fallback gets the same clearance from the
        // section's own `pt-16`, so the two versions sit in the same place.
        padTop: 72,
        // Clears the rule and the Scroll / Let's create controls below.
        padBottom: 150,
      });
      setTexture((previous) => {
        previous?.dispose();
        return baked;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [size.width, size.height, quality]);

  // Dispose the last texture on unmount. CanvasTextures hold a full-size
  // canvas each; leaking one per resize is a real memory cost on a long page.
  useEffect(() => () => texture?.dispose(), [texture]);

  const uniforms = useMemo(
    () => ({
      uWordmark: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uLens: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDispersion: { value: quality === 'low' ? 0.55 : 1 },
      // Low, because `.paper-grain` already lays a tooth over the entire page
      // including this canvas. At the shader's original 0.055 the two stacked
      // and the hero read visibly noisier than every section below it.
      uGrain: { value: 0.015 },
      uLumen: { value: colours.lumen },
      uBeam: { value: colours.beam },
      uUltra: { value: colours.ultra },
      uSpill: { value: colours.spill },
    }),
    // Intentionally built once: see the note above about material rebuilds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const material = materialRef.current;
    if (!material || !texture) return;
    material.uniforms.uWordmark.value = texture;
  }, [texture]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const u = material.uniforms;
    const dt = Math.min(delta, 0.05);

    u.uTime.value = state.clock.elapsedTime;
    u.uResolution.value.set(size.width, size.height);

    // Entrance ramp. Only starts once the texture exists, so the resolve is
    // never spent on an empty frame.
    if (texture) {
      u.uProgress.value = damp(u.uProgress.value, 1, 1.6, dt);
    }

    // Scroll drives the slab. Scrubbed upstream by ScrollTrigger; damped here
    // so a wheel flick does not snap it across the frame.
    u.uLens.value = damp(u.uLens.value, scrollRef.current, 6, dt);

    const p = pointerRef.current;
    pointer.current.x = damp(pointer.current.x, p.active ? p.x : 0, 3, dt);
    pointer.current.y = damp(pointer.current.y, p.active ? p.y : 0, 3, dt);
    u.uPointer.value.set(pointer.current.x, pointer.current.y);
  });

  return (
    <mesh frustumCulled={false}>
      {/* Two triangles. The quad is sized in clip space by the vertex shader's
          pass-through, so it needs no layout and no viewport measurement. */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={LENS_VERTEX}
        fragmentShader={LENS_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
