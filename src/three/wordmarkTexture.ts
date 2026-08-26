import * as THREE from 'three';

/**
 * Rasterises the hero wordmark to a texture, once.
 *
 * The lens refracts *type*, and type does not move. An earlier plan had the
 * words rendered as their own mesh and read into a render target every frame
 * so the slab could sample a live scene — that is the general solution to
 * refracting arbitrary content, and it is entirely wasted here: it re-renders
 * an identical image sixty times a second to feed a shader that would accept a
 * static one. Baking removes a render target, a second draw call, and the MSDF
 * atlas the live path would have needed, and the result is pixel-identical.
 *
 * Two channels are baked rather than one:
 *
 *   R — sharp glyph coverage, the type itself
 *   G — the same glyphs under a heavy blur, used as the glow term
 *
 * That is what buys the bloom. A post-processing pass would need its own
 * threshold extract, two blur passes and a composite, all at full resolution,
 * every frame; the glow here costs a channel of a texture that is already
 * being sampled and is computed exactly once. Bloom is the effect most
 * commonly reached for and least commonly needed, and this is why.
 */

export interface WordmarkLine {
  text: string;
  /** 0 = left edge, 1 = right edge. Governs both position and alignment. */
  align: 0 | 1;
}

const GLOW_BLUR_PX = 26;

/**
 * Largest font size at which `text` still fits `maxWidth`.
 *
 * Binary search rather than the usual measure-once-and-scale, because the
 * display face is variable: `wdth` and `opsz` are size-dependent, so advance
 * width is not linear in font size and a single measurement extrapolates
 * wrong. Ten iterations resolves to well under a pixel.
 */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontFor: (size: number) => string
): number {
  let lo = 8;
  let hi = 1200;
  for (let i = 0; i < 10; i += 1) {
    const mid = (lo + hi) / 2;
    ctx.font = fontFor(mid);
    if (ctx.measureText(text).width <= maxWidth) lo = mid;
    else hi = mid;
  }
  return lo;
}

export interface BakeOptions {
  width: number;
  height: number;
  /** Device pixel ratio to bake at. Clamped — see the call site. */
  dpr: number;
  /** Horizontal inset, in CSS pixels, matching the DOM gutter. */
  padding: number;
  /** Clearance for the fixed nav bar, in CSS pixels. */
  padTop: number;
  /** Clearance for the scroll controls under the lower word. */
  padBottom: number;
}

/**
 * Bakes the wordmark. Callers MUST await `document.fonts.ready` first, or the
 * display face will not have arrived and the fallback gets baked into the
 * texture permanently — there is no second chance, because nothing re-renders
 * this on font load.
 */
export function bakeWordmark(
  lines: WordmarkLine[],
  { width, height, dpr, padding, padTop, padBottom }: BakeOptions
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for wordmark bake');

  ctx.scale(dpr, dpr);

  const fontFor = (size: number) =>
    `800 ${size}px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`;

  const usable = width - padding * 2;

  // Lay the lines out first so both passes draw identical geometry.
  //
  // Vertical placement comes from measured glyph metrics, not from a fraction
  // of the height. Fractions were the bug: at 0.2 the cap of the upper word
  // landed underneath the fixed nav bar, and because the cap height of a
  // variable face at `wght 800` is not a fixed ratio of its font size, no
  // single fraction is correct at every viewport. Asking the font where its
  // ink actually starts is both exact and self-correcting.
  const placed = lines.map((line, i) => {
    const size = fitFontSize(ctx, line.text, usable, fontFor);
    ctx.font = fontFor(size);
    const m = ctx.measureText(line.text);
    const ascent = m.actualBoundingBoxAscent;
    const descent = m.actualBoundingBoxDescent;

    // textBaseline is 'alphabetic' for measurement here; the draw pass sets
    // 'middle', so convert: the middle baseline sits half the ink box below
    // the alphabetic one.
    const half = (ascent + descent) / 2;

    const y =
      i === 0
        ? padTop + half // top of the ink sits exactly on padTop
        : height - padBottom - half; // bottom of the ink sits on padBottom

    const x = line.align === 0 ? padding : width - padding;
    return { ...line, size, x, y };
  });

  const draw = (blur: number) => {
    ctx.save();
    ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    for (const line of placed) {
      ctx.font = fontFor(line.size);
      ctx.textAlign = line.align === 0 ? 'left' : 'right';
      ctx.fillText(line.text, line.x, line.y);
    }
    ctx.restore();
  };

  // Green first, then red over it. Both are drawn with `lighter` compositing
  // into separate channels via the channel mask below, which is cheaper than
  // maintaining two canvases and uploading two textures.
  ctx.globalCompositeOperation = 'source-over';

  // Glow pass -> green. Drawn white, then masked to the green channel.
  draw(GLOW_BLUR_PX);
  const glow = ctx.getImageData(0, 0, canvas.width, canvas.height);

  ctx.clearRect(0, 0, width, height);
  draw(0);
  const sharp = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Compose: R = sharp coverage, G = glow, B unused, A opaque. Working on the
  // alpha of each pass rather than its colour keeps this correct regardless of
  // how the browser antialiases the blur.
  const out = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = sharp.data[i + 3];
    out.data[i + 1] = glow.data[i + 3];
    out.data[i + 2] = 0;
    out.data[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace; // data, not colour
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}
