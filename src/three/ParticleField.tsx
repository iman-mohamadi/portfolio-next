import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SIMPLEX_3D } from './shaders/noise';
import { useThemeColors } from './useThemeColors';
import type { PointerRef, ScrollRef } from './types';

const vertexShader = /* glsl */ `
${SIMPLEX_3D}

attribute float aSeed;
attribute float aScale;
attribute vec3 aColor;

uniform float uTime;
uniform float uSize;
uniform float uScroll;
uniform vec2 uPointer;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 pos = position;

  // Each particle orbits the origin at its own rate, so the cloud shears
  // instead of rotating as one rigid body.
  float speed = 0.05 + aSeed * 0.11;
  float angle = uTime * speed;
  float c = cos(angle);
  float s = sin(angle);
  pos.xz = mat2(c, -s, s, c) * pos.xz;

  // Low-frequency drift keeps it from ever looking like a fixed lattice.
  vec3 drift = vec3(
    snoise(pos * 0.11 + vec3(uTime * 0.05, 0.0, 0.0)),
    snoise(pos * 0.11 + vec3(0.0, uTime * 0.045, 12.0)),
    snoise(pos * 0.11 + vec3(24.0, 0.0, uTime * 0.04))
  );
  pos += drift * 0.55;

  // Pointer pushes the field with a soft parallax.
  pos.x += uPointer.x * 0.9 * (0.4 + aSeed);
  pos.y += uPointer.y * 0.6 * (0.4 + aSeed);

  // Scroll pulls the whole field toward the camera and thins it out.
  pos.z += uScroll * 9.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  gl_Position = projectionMatrix * mvPosition;

  // Clamp the perspective scaling. Without a ceiling, any particle that drifts
  // near the camera renders as a huge soft disc — those were the blobs smeared
  // across the hero.
  float size = uSize * aScale * uPixelRatio * (14.0 / max(-mvPosition.z, 1.0));
  gl_PointSize = clamp(size, 1.0, 4.0);

  vColor = aColor;

  // Fade at both ends of the depth range and as the hero scrolls away.
  float depthFade = smoothstep(-34.0, -8.0, mvPosition.z) * (1.0 - smoothstep(-6.0, -1.0, mvPosition.z));
  float twinkle = 0.6 + 0.4 * sin(uTime * 1.3 + aSeed * 20.0);
  vAlpha = depthFade * twinkle * (1.0 - uScroll * 0.9) * 0.22;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Round, soft-edged point. Discarding early beats blending the whole quad.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float alpha = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(vColor, alpha);
  #include <colorspace_fragment>
}
`;

interface ParticleFieldProps {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
  quality: 'low' | 'mid' | 'high';
}

/** GPU-animated point cloud that gives the hero its depth and sense of scale. */
export function ParticleField({ scrollRef, pointerRef, quality }: ParticleFieldProps) {
  // Background depth only. This used to carry 14k points and dominated the
  // frame; the wordmark is the subject now.
  const count = quality === 'high' ? 2200 : quality === 'mid' ? 1400 : 700;
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const colors = useThemeColors();

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colorAttr = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    // Paper fibres and stray ink, not stars. Colours are baked into the buffer,
    // so the geometry is rebuilt when the theme flips — cheap at this count.
    const fibre = colors.inkMid;
    const ink = colors.ink;
    const spot = colors.spot;

    for (let i = 0; i < count; i++) {
      // Cube-root radius keeps density even through the shell instead of
      // clumping everything at the centre.
      const r = 5 + Math.cbrt(Math.random()) * 13;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.62; // flattened: reads as a disc, not a ball
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const roll = Math.random();
      const color = roll > 0.985 ? spot : roll > 0.8 ? ink : fibre;
      colorAttr[i * 3] = color.r;
      colorAttr[i * 3 + 1] = color.g;
      colorAttr[i * 3 + 2] = color.b;

      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.random() * Math.random() * 1.9;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colorAttr, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [count, colors]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 2.0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
    }),
    []
  );

  // Reached through the material ref, not the local uniforms object — that copy
  // is detached from the material and updating it animates nothing.
  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value += Math.min(delta, 0.05);
    mat.uniforms.uScroll.value = scrollRef.current;
    mat.uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
