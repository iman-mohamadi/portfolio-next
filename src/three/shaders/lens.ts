import { SIMPLEX_3D } from './noise';

/**
 * The lens.
 *
 * A single full-screen quad. There is no glass mesh: the slab is a *region* in
 * screen space, and inside that region the shader samples the baked wordmark
 * at three slightly different offsets — one per colour channel — which is what
 * chromatic dispersion physically is. Outside the region the offset is zero
 * and the type resolves perfectly sharp, so the same shader draws both the
 * glass and the absence of it.
 *
 * Everything that would normally be a post-processing pass happens here, in
 * the same fragment: glow (from the baked G channel), grain, and vignette.
 * An EffectComposer would cost three full-resolution passes and two extra
 * render targets to produce the same image.
 */

/**
 * Clip-space passthrough. A 2x2 plane's positions already span -1..1, so
 * writing them straight to `gl_Position` fills the viewport exactly and makes
 * the quad independent of where the camera is or what its fov is. Going
 * through the projection matrix would make the hero's size a function of
 * camera distance, which is the sort of coupling that breaks the moment
 * anything wants to dolly.
 */
export const LENS_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const LENS_FRAGMENT = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uWordmark;
uniform vec2  uResolution;
uniform float uTime;
uniform float uProgress;    // 0..1 entrance resolve
uniform float uLens;        // 0..1 slab travel, scroll-driven
uniform vec2  uPointer;     // -1..1, damped
uniform float uDispersion;  // master strength
uniform float uGrain;

uniform vec3 uLumen;
uniform vec3 uBeam;
uniform vec3 uUltra;
uniform vec3 uSpill;

${SIMPLEX_3D}

/** Cheap hash for the grain. Deliberately not noise — grain wants to be white. */
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = vUv;

  // ---------------------------------------------------------------------
  // The slab. A soft vertical band travelling left to right, tilted slightly
  // so it never reads as a UI element. Its centre is driven by scroll; the
  // pointer only nudges it, and only the slab — never the type. Displacing
  // the type with the pointer tears a hole through the mark and through the
  // copy behind it, which is a mistake worth not repeating.
  // ---------------------------------------------------------------------
  float travel = mix(-0.35, 1.35, uLens);
  float tilt = (uv.y - 0.5) * 0.22;
  float centre = travel + tilt + uPointer.x * 0.035;

  float halfWidth = 0.19;
  float d = abs(uv.x - centre) / halfWidth;

  // Smooth band with a hard-ish core: the edges are where dispersion lives,
  // the middle is where the type is most displaced.
  float band = 1.0 - smoothstep(0.0, 1.0, d);
  float edge = band * (1.0 - band) * 4.0; // peaks at the two rims

  // Surface imperfection. Real glass is not CG-clean, and the difference
  // between "a shader" and "an object" is almost entirely this term.
  vec3 np = vec3(uv * vec2(aspect, 1.0) * 3.2, uTime * 0.06);
  float ripple = fbm2(np, uTime) * 0.5;

  float strength = band * uDispersion * uProgress;

  // Refractive offset: pushes away from the slab centre, modulated by the
  // surface. The 1/aspect keeps the displacement circular rather than
  // stretched on wide viewports.
  float dir = sign(uv.x - centre);
  vec2 offset = vec2(dir * (0.5 - abs(0.5 - band)) * 0.055, ripple * 0.012);
  offset.x /= aspect;
  offset *= strength;

  // ---------------------------------------------------------------------
  // Dispersion. Three samples, one per channel, at increasing offsets. Long
  // wavelengths bend least — red gets the smallest offset, blue the largest,
  // which is the right way round and is why the fringing reads as an optic
  // rather than as a glitch effect.
  // ---------------------------------------------------------------------
  float spread = 1.0 + edge * 1.6;
  vec2 oR = offset * 0.72 * spread;
  vec2 oG = offset * 1.00 * spread;
  vec2 oB = offset * 1.34 * spread;

  float sharpR = texture2D(uWordmark, uv + oR).r;
  float sharpG = texture2D(uWordmark, uv + oG).r;
  float sharpB = texture2D(uWordmark, uv + oB).r;
  vec3 mark = vec3(sharpR, sharpG, sharpB);

  // Glow rides the green channel of the same fetch — no extra pass.
  float glow = texture2D(uWordmark, uv + oG).g;

  // ---------------------------------------------------------------------
  // Colour. The type is emissive: it is not lit, it *is* the light. Base is
  // lumen; the dispersed fringes tint toward beam on the leading rim and
  // spill on the trailing one, which is the only place a warm colour is
  // permitted anywhere in this design.
  // ---------------------------------------------------------------------
  float fringe = clamp(abs(sharpB - sharpR) * 2.4, 0.0, 1.0);
  vec3 tint = mix(uBeam, uSpill, smoothstep(-1.0, 1.0, dir));

  vec3 colour = uLumen * mark;
  colour = mix(colour, tint, fringe * 0.85);
  colour += uBeam * glow * 0.16 * (0.6 + 0.4 * band);
  colour += uUltra * band * 0.055;               // the slab's own body
  colour += tint * edge * 0.10 * uProgress;      // rim catch

  // Entrance: the mark resolves out of a defocused, dimmed state. Not a fade
  // — the glow arrives before the sharp coverage does, so it reads as coming
  // into focus rather than into existence.
  float focus = smoothstep(0.0, 1.0, uProgress);
  colour *= mix(0.0, 1.0, focus);
  colour += uBeam * glow * (1.0 - focus) * 0.28;

  // ---------------------------------------------------------------------
  // Grain and vignette. The grain is not decoration: eight-bit output cannot
  // represent this gradient's steps, and without dither the void bands
  // visibly across any large dark area. It happens to also be the signature.
  // ---------------------------------------------------------------------
  float g = hash21(gl_FragCoord.xy + fract(uTime) * 137.0);
  colour += (g - 0.5) * uGrain;

  vec2 vc = (uv - 0.5) * vec2(aspect, 1.0);
  float vignette = 1.0 - smoothstep(0.45, 1.05, length(vc));
  colour *= mix(0.72, 1.0, vignette);

  // Alpha follows luminance: the canvas composites over the page, so the void
  // must come from the DOM behind it and not be painted here. Painting it
  // would put an opaque black rectangle over every section below the hero the
  // instant the frameloop freezes.
  float alpha = clamp(max(max(colour.r, colour.g), colour.b), 0.0, 1.0);

  gl_FragColor = vec4(colour, alpha);
}
`;
