import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SIMPLEX_3D } from './shaders/noise';
import { damp } from '../lib/motion';
import { useThemeColors } from './useThemeColors';
import { useStableViewport } from './useStableViewport';
import type { PointerRef, ScrollRef } from './types';

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${SIMPLEX_3D}

uniform sampler2D uMap;
uniform float uTime;
uniform float uOpacity;
uniform float uScroll;
uniform float uInkFloor;
uniform vec2 uMaskCenter;
uniform vec2 uMaskRadius;
uniform float uInkCeil;
uniform float uHalftoneScale;
uniform float uHalftoneMix;
uniform float uInvert;
uniform vec3 uInk;
uniform vec3 uInkMid;

varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  float lum = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));

  // The key has to flip with the ground, because "figure" means the opposite
  // thing on each. On paper the plate is INK, so density rises as the image
  // darkens. On a dark ground the plate is LIGHT, so it rises with the
  // highlights instead — the same photograph, printed or projected.
  float base = smoothstep(uInkFloor, uInkCeil, lum);
  float tone = mix(1.0 - base, base, uInvert);

  // The background is cut SPATIALLY, not tonally. A luminance threshold cannot
  // work on this source: the studio backdrop and the subject's own shadows
  // occupy the same range, so any cut dark enough to drop the backdrop also
  // eats the face. An elliptical vignette over the head separates them by
  // geometry instead, which is also just how a portrait plate is masked.
  vec2 d = (vUv - uMaskCenter) / uMaskRadius;
  float mask = 1.0 - smoothstep(0.58, 1.0, length(d));

  float coverage = tone * mask;

  // Halftone: a rotated dot screen whose dots grow as the image darkens —
  // how a photograph is actually reproduced in print. Mixed rather than applied
  // outright, so it reads as a printing process and not a filter.
  vec2 hp = vUv * uHalftoneScale;
  float a = 0.4;
  vec2 rp = vec2(hp.x * cos(a) - hp.y * sin(a), hp.x * sin(a) + hp.y * cos(a));
  vec2 cell = fract(rp) - 0.5;
  float radius = sqrt(clamp(coverage, 0.0, 1.0)) * 0.52;
  float dots = smoothstep(radius, radius - 0.09, length(cell));

  float alpha = mix(coverage, dots * coverage, uHalftoneMix);

  // Dense where the plate is dark, thinning toward the highlights.
  vec3 color = mix(uInk, uInkMid, smoothstep(0.25, 0.9, mix(lum, 1.0 - lum, uInvert)));

  // Fibrous tooth so the plate never looks vector-clean.
  float grain = snoise(vec3(vUv * 260.0, uTime * 0.3)) * 0.5 + 0.5;
  alpha *= 0.88 + grain * 0.12;

  gl_FragColor = vec4(color, alpha * uOpacity * (1.0 - uScroll * 0.9));
  #include <colorspace_fragment>
}
`;

interface PortraitVeilProps {
  src: string;
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
}

/**
 * The portrait as a printed plate: a large plane where the photograph's shadows
 * become ink on the paper ground and its highlights drop out to bare stock,
 * screened through a rotated halftone.
 */
export function PortraitVeil({ src, scrollRef, pointerRef }: PortraitVeilProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const colors = useThemeColors();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const viewport = useStableViewport();

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    let disposed = false;
    let loaded: THREE.Texture | null = null;

    loader.load(
      src,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        loaded = tex;
        setTexture(tex);
      },
      undefined,
      // A CORS failure must not take the hero down.
      () => undefined
    );

    return () => {
      disposed = true;
      loaded?.dispose();
    };
  }, [src]);

  // Keyed on the texture so the material is built with the map already in
  // place — R3F clones this object into the material, so assigning uMap
  // afterwards would write to a detached copy and the plate would stay blank.
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTime: { value: 0 },
      uOpacity: { value: 0.9 },
      uScroll: { value: 0 },
      uInkFloor: { value: 0.05 },
      uInkCeil: { value: 0.99 },
      // Measured off the source, not guessed: the lit face centroid sits at
      // UV (0.367, 0.649), so the ellipse is centred there and widened to take
      // in the hair and beard around it. Re-measure if the portrait changes.
      uMaskCenter: { value: new THREE.Vector2(0.385, 0.60) },
      uMaskRadius: { value: new THREE.Vector2(0.30, 0.36) },
      uHalftoneScale: { value: 170 },
      uHalftoneMix: { value: 0.55 },
      uInvert: { value: colors.isDark ? 1 : 0 },
      uInk: { value: colors.ink.clone() },
      uInkMid: { value: colors.inkMid.clone() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colours are copied in below
    [texture]
  );

  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uInvert.value = colors.isDark ? 1 : 0;
    mat.uniforms.uInk.value.copy(colors.ink);
    mat.uniforms.uInkMid.value.copy(colors.inkMid);
  }, [colors]);

  const wide = viewport.width > 10;
  const restX = wide ? viewport.width * 0.29 : 0;
  // Narrow screens have no side column to put the plate in, so it lifts above
  // the copy and shrinks. Centred at full size it sat directly behind the
  // standfirst and body text and made both unreadable.
  const restY = wide ? 0 : viewport.height * 0.24;
  const plateScale = wide ? 1 : 0.62;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const mat = matRef.current;
    if (mat) {
      mat.uniforms.uTime.value += dt;
      mat.uniforms.uScroll.value = scrollRef.current;
      // Lighter on mobile so any overlap stays legible.
      mat.uniforms.uOpacity.value = wide ? 0.9 : 0.5;
    }

    const group = groupRef.current;
    if (group) {
      group.position.x = damp(group.position.x, restX - pointerRef.current.x * 0.5, 2, dt);
      group.position.y = damp(group.position.y, restY + pointerRef.current.y * -0.32, 2, dt);
    }
  });

  if (!texture) return null;

  // Overfills the viewport height so the figure is cropped by the frame.
  const height = Math.max(viewport.height * 1.35, 9);
  const image = texture.image as { width?: number; height?: number } | undefined;
  const aspect = (image?.width ?? 3) / (image?.height ?? 4);

  return (
    <group ref={groupRef} position={[restX, restY, -2.2]} scale={plateScale}>
      <mesh renderOrder={-1}>
        <planeGeometry args={[height * aspect, height]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}
