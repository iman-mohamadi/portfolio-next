import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SIMPLEX_3D } from './shaders/noise';
import { gsap } from '../lib/gsap';
import { useThemeColors } from './useThemeColors';
import { useStableViewport } from './useStableViewport';
import type { PointerRef, ScrollRef } from './types';

const LINES = ['IMAN', 'MOHAMMADI'];

/** World-space width the wordmark should span. */
const TARGET_WIDTH = 9.2;

const vertexShader = /* glsl */ `
${SIMPLEX_3D}

attribute vec3 aTarget;
attribute vec3 aScatter;
attribute float aSeed;
attribute float aScale;

uniform float uTime;
uniform float uProgress;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uScroll;

varying float vAlpha;
varying float vForm;
varying float vHot;

void main() {
  // Per-particle delay so the wordmark assembles letter-dust first, edges last,
  // instead of every point arriving on the same frame.
  float delay = aSeed * 0.28;
  float p = clamp((uProgress - delay) / max(1.0 - delay, 0.001), 0.0, 1.0);
  p = 1.0 - pow(1.0 - p, 3.0);
  vForm = p;

  vec3 pos = mix(aScatter, aTarget, p);

  // Residual drift: strong while scattered, a fine shimmer once formed. Kept
  // well below stroke width so the letterforms stay legible.
  float wobbleAmount = mix(0.85, 0.012, p);
  vec3 wobble = vec3(
    snoise(pos * 0.55 + vec3(uTime * 0.22, 0.0, aSeed * 8.0)),
    snoise(pos * 0.55 + vec3(0.0, uTime * 0.19, aSeed * 8.0 + 4.0)),
    snoise(pos * 0.4 + vec3(aSeed * 8.0, 0.0, uTime * 0.16))
  );
  pos += wobble * wobbleAmount;

  // Pointer proximity tints the mark rather than displacing it. Pushing the
  // particles apart tore a hole through the wordmark and, with the copy sitting
  // behind it, through the text as well.
  vHot = smoothstep(uMouseRadius, 0.0, length(pos.xy - uMouse)) * p;

  // Scrolling away blows the wordmark back out into the cloud.
  pos += normalize(pos + vec3(0.001)) * uScroll * 7.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Small and hard-clamped: legibility comes from point density following the
  // glyph outlines, not from big glowing discs.
  float size = uSize * aScale * uPixelRatio * (9.0 / max(-mvPosition.z, 1.0));
  gl_PointSize = clamp(size, 1.0, 3.5);

  // Ink density varies slightly per particle rather than pulsing — a printed
  // mark doesn't twinkle. The oscillation is nearly flat and very slow.
  float density = 0.92 + 0.08 * sin(uTime * 0.7 + aSeed * 30.0);
  // Scattered motes stay faint so only the assembled name carries weight.
  vAlpha = mix(0.16, 1.0, p) * density * (1.0 - uScroll);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform vec3 uColorHot;

varying float vAlpha;
varying float vForm;
varying float vHot;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Drifting motes are the lighter, thinner ink; the settled wordmark darkens
  // toward full density as it lands — spattered ink drying into type.
  vec3 color = mix(uColorBase, uColorAccent, smoothstep(0.35, 1.0, vForm));
  // Warm to the accent under the pointer.
  color = mix(color, uColorHot, vHot);

  // Hard-ish edge. On paper a soft halo reads as a smudge, not a printed dot.
  float alpha = smoothstep(0.5, 0.24, d) * vAlpha;
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

/**
 * Samples the wordmark from a 2D canvas and uses the opaque pixels as target
 * positions for a GPU particle system. The particles start as a loose cloud and
 * converge into "IMAN MOHAMMADI".
 */
function sampleTextPoints(count: number): { targets: Float32Array } | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const W = 1400;
  const MARGIN = 48;

  // Fit the type to the bitmap rather than assuming a size: at a hardcoded
  // size "MOHAMMADI" ran off both edges and the particles formed a clipped
  // wordmark. The face must match the site's display font, or the hero is set
  // in something the rest of the page never uses.
  const BASE = 100;
  ctx.font = `900 ${BASE}px "Playfair Display", Georgia, serif`;
  const widest = Math.max(...LINES.map((line) => ctx.measureText(line).width));
  if (widest === 0) return null;

  const fontSize = (BASE * (W - MARGIN * 2)) / widest;
  const lineHeight = fontSize * 1.02;
  const H = Math.ceil(lineHeight * LINES.length + fontSize * 0.45);

  canvas.width = W;
  canvas.height = H;

  // Resizing the canvas resets the 2D context, so restyle after.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px "Playfair Display", Georgia, serif`;

  LINES.forEach((line, i) => {
    const y = H / 2 + (i - (LINES.length - 1) / 2) * lineHeight;
    ctx.fillText(line, W / 2, y);
  });

  const { data } = ctx.getImageData(0, 0, W, H);

  // Collect every sufficiently-bright pixel, then thin the pool down. Sampling
  // on a stride would bias toward vertical stems and thin the curves.
  const candidates: number[] = [];
  const stride = 2;
  for (let y = 0; y < H; y += stride) {
    for (let x = 0; x < W; x += stride) {
      if (data[(y * W + x) * 4] > 128) candidates.push(x, y);
    }
  }

  const total = candidates.length / 2;
  if (total === 0) return null;

  const scale = TARGET_WIDTH / W;
  const targets = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const pick = Math.floor(Math.random() * total) * 2;
    // Jitter within the sampling cell so the glyph edges stay soft.
    const x = candidates[pick] + (Math.random() - 0.5) * stride;
    const y = candidates[pick + 1] + (Math.random() - 0.5) * stride;

    targets[i * 3] = (x - W / 2) * scale;
    targets[i * 3 + 1] = -(y - H / 2) * scale;
    targets[i * 3 + 2] = (Math.random() - 0.5) * 0.22;
  }

  return { targets };
}

interface NameParticlesProps {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
  quality: 'low' | 'mid' | 'high';
}

export function NameParticles({ scrollRef, pointerRef, quality }: NameParticlesProps) {
  // Density is what makes the glyphs read as letters rather than as scattered
  // dust, so the floor stays high even on weak hardware.
  const count = quality === 'high' ? 24000 : quality === 'mid' ? 16000 : 9000;
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  // Uniforms MUST be reached through the live material. The object handed to
  // <shaderMaterial uniforms={...}> is cloned during material construction, so
  // mutating the local copy updates nothing — that is what left every particle
  // frozen at uProgress 0, i.e. permanently scattered.
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const colors = useThemeColors();
  const viewport = useStableViewport();

  useEffect(() => {
    let cancelled = false;

    const build = async () => {
      // Metrics must be real before sampling, or the glyphs are the fallback face.
      await document.fonts.ready;
      try {
        await document.fonts.load('900 100px "Playfair Display"');
      } catch {
        // Fall through — sampleTextPoints degrades to the generic sans stack.
      }
      if (cancelled) return;

      const sampled = sampleTextPoints(count);
      if (!sampled || cancelled) return;

      const scatter = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      const scales = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        // Start on a shell close enough that the convergence is legible as the
        // name gathering, not as a galaxy that happens to collapse.
        const r = 4.5 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        scatter[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        scatter[i * 3 + 1] = r * Math.cos(phi) * 0.55;
        scatter[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.6;

        seeds[i] = Math.random();
        scales[i] = 0.5 + Math.random() * Math.random() * 1.6;
      }

      const geo = new THREE.BufferGeometry();
      // `position` is required by three even though the shader drives placement
      // from aTarget/aScatter; seed it with the targets for correct bounds.
      geo.setAttribute('position', new THREE.BufferAttribute(sampled.targets.slice(), 3));
      geo.setAttribute('aTarget', new THREE.BufferAttribute(sampled.targets, 3));
      geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

      setGeometry(geo);
    };

    void build();
    return () => {
      cancelled = true;
    };
  }, [count]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSize: { value: 2.2 },
      uPixelRatio: {
        value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
      },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uMouseRadius: { value: 2.3 },
      uScroll: { value: 0 },
      // Thin wash while airborne, full density once the letterform is struck.
      // Both follow the theme, so the mark is ink on paper and light on dark.
      uColorBase: { value: colors.inkMid.clone() },
      uColorAccent: { value: colors.ink.clone() },
      uColorHot: { value: colors.spot.clone() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see note above
    []
  );

  // Formation is driven by GSAP rather than useFrame. useFrame only ticks while
  // the R3F render loop is running; if anything stops that loop the wordmark
  // silently never assembles. GSAP owns its own clock, and the timeout below is
  // on the wall clock, so the name resolves under every failure mode.
  useEffect(() => {
    if (!geometry) return;

    const setProgress = (v: number) => {
      const mat = matRef.current;
      if (mat) mat.uniforms.uProgress.value = v;
    };

    const proxy = { v: 0 };
    const tween = gsap.to(proxy, {
      v: 1,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: () => setProgress(proxy.v),
    });

    // Wall-clock net, independent of both GSAP's ticker and the render loop.
    const failsafe = window.setTimeout(() => setProgress(1), 6000);

    return () => {
      tween.kill();
      window.clearTimeout(failsafe);
    };
  }, [geometry]);

  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uColorBase.value.copy(colors.inkMid);
    mat.uniforms.uColorAccent.value.copy(colors.ink);
    mat.uniforms.uColorHot.value.copy(colors.spot);
  }, [colors]);

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;

    const dt = Math.min(delta, 0.05);
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uScroll.value = scrollRef.current;
    // Park the repulsion far off-frame until the pointer has genuinely moved.
    // Otherwise the default 0,0 maps to screen centre and blows a permanent
    // hole through the middle of the wordmark before anyone touches the mouse.
    const p = pointerRef.current;
    if (p.active) {
      mat.uniforms.uMouse.value.set((p.x * viewport.width) / 2, (p.y * viewport.height) / 2);
    } else {
      mat.uniforms.uMouse.value.set(9999, 9999);
    }
  });

  if (!geometry) return null;

  // Wide viewports get a two-column composition: wordmark left, portrait right.
  // Narrow ones stack them, with the name centred over the portrait.
  const wide = viewport.width > 10;
  // Never let the wordmark run past the frame edges.
  const fit = Math.min(1, (viewport.width * (wide ? 0.57 : 0.86)) / TARGET_WIDTH);

  return (
    <points
      geometry={geometry}
      frustumCulled={false}
      // Narrow screens push the wordmark into the upper half, clear of the DOM
      // copy that occupies the lower half.
      position={[wide ? -viewport.width * 0.16 : 0, wide ? 0.45 : 1.6, 0]}
      scale={fit}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        // Normal, not additive. Additive adds light — on a paper ground it
        // drives every particle toward white and the wordmark disappears.
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
