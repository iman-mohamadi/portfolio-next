import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SIMPLEX_3D } from './shaders/noise';
import { damp } from '../lib/motion';
import { useThemeColors } from './useThemeColors';
import type { PointerRef, ScrollRef } from './types';

const vertexShader = /* glsl */ `
${SIMPLEX_3D}

uniform float uTime;
uniform float uDisplace;
uniform float uScroll;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vCrest;

vec3 displace(vec3 p, vec3 n, out float amount) {
  amount = snoise(p * 0.62 + vec3(0.0, uTime * 0.22, 0.0)) * uDisplace;
  return p + n * amount;
}

void main() {
  // Rebuild the normal from the displaced surface. Without this the lighting
  // stays spherical and the blob reads as a flat disc rather than a solid.
  vec3 n = normalize(normal);
  vec3 tangent = normalize(cross(n, vec3(0.0, 1.0, 0.0) + vec3(0.001)));
  vec3 bitangent = normalize(cross(n, tangent));
  float eps = 0.06;

  float a0, a1, a2;
  vec3 p0 = displace(position, n, a0);
  vec3 t1 = position + tangent * eps;
  vec3 t2 = position + bitangent * eps;
  vec3 p1 = displace(t1, normalize(t1), a1);
  vec3 p2 = displace(t2, normalize(t2), a2);

  vNormal = normalize(normalMatrix * normalize(cross(p1 - p0, p2 - p0)));
  vCrest = a0 / max(uDisplace, 0.0001);

  vec3 finalPos = p0 * (1.0 - uScroll * 0.25);

  vec4 mv = modelViewMatrix * vec4(finalPos, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uDeep;
uniform vec3 uSheen;
uniform float uOpacity;
uniform float uScroll;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vCrest;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // Two lights, both faked in view space: a key from upper-left and a cool
  // bounce from below-right. Enough to read as a glossy solid without any
  // scene lighting to configure.
  vec3 keyDir = normalize(vec3(-0.45, 0.75, 0.55));
  vec3 fillDir = normalize(vec3(0.6, -0.4, 0.4));

  float key = max(dot(N, keyDir), 0.0);
  float fill = max(dot(N, fillDir), 0.0) * 0.35;

  // Blinn-Phong specular: the tight hot spot that sells "wet".
  vec3 H = normalize(keyDir + V);
  float spec = pow(max(dot(N, H), 0.0), 48.0);

  // Fresnel: thin, bright edge where the surface turns away.
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);

  vec3 color = mix(uDeep, uBody, key * 0.85 + fill);
  color += uSheen * spec * 0.9;
  color = mix(color, uSheen, fres * 0.35);

  // Crests catch a touch more light, so the surface undulation is legible.
  color += uSheen * smoothstep(0.35, 1.0, vCrest) * 0.08;

  gl_FragColor = vec4(color, uOpacity * (1.0 - uScroll * 0.85));
  #include <colorspace_fragment>
}
`;

interface BlobProps {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
  quality: 'low' | 'mid' | 'high';
}

/**
 * The hero centrepiece: a slowly morphing glossy blob. A noise-displaced
 * icosphere with rebuilt normals and faked two-point lighting, so it reads as a
 * wet solid without any lights in the scene to keep in sync.
 */
export function Blob({ scrollRef, pointerRef, quality }: BlobProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const colors = useThemeColors();

  const detail = quality === 'high' ? 64 : quality === 'mid' ? 40 : 24;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDisplace: { value: 0.38 },
      uScroll: { value: 0 },
      uOpacity: { value: 1 },
      uBody: { value: colors.spot.clone() },
      uDeep: { value: new THREE.Color('#c2350a') },
      uSheen: { value: new THREE.Color('#ffd9c4') },
    }),
    // Colours are pushed in below; rebuilding this object would rebuild the
    // material and reset every animated uniform.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const mat = matRef.current;
    if (mat) {
      mat.uniforms.uTime.value += dt;
      mat.uniforms.uScroll.value = scrollRef.current;
      mat.uniforms.uBody.value.copy(colors.spot);
    }

    const group = groupRef.current;
    if (group) {
      group.rotation.y += dt * 0.12;
      // Leans toward the pointer rather than tracking it, so it stays an object
      // in the frame instead of a cursor follower.
      group.rotation.x = damp(group.rotation.x, pointerRef.current.y * 0.25, 2.5, dt);
      group.rotation.z = damp(group.rotation.z, pointerRef.current.x * -0.18, 2.5, dt);
      group.position.x = damp(group.position.x, pointerRef.current.x * 0.18, 2, dt);
      group.position.y = damp(group.position.y, pointerRef.current.y * 0.12, 2, dt);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.75, detail]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </group>
  );
}
