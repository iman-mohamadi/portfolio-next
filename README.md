# Iman Mohammadi — Portfolio

A portfolio built as a scroll-driven WebGL experience, art-directed as a printed
page: warm paper ground, near-black ink, hairline rules, and a single vermilion
spot colour. Light and dark are both first-class.

## Run locally

**Prerequisites:** Node.js 20+, pnpm

```bash
pnpm install
```

```bash
pnpm dev
```

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Vite dev server on `:3000` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the production build |
| `pnpm lint` | `tsc --noEmit` (strict) |

## Architecture

```
src/
  lib/gsap.ts            Single GSAP registration point + the signature eases
  lib/motion.ts          Reduced-motion probe, damping, WebGL + GPU tier checks
  lib/theme.ts           Theme state on the document, broadcast as a DOM event
  providers/             Lenis <-> ScrollTrigger bridge, scroll locking
  hooks/                 useTheme, useReducedMotion, useDialog, useUiSounds
  components/motion/     Reveal, Magnetic, Counter, VelocityMarquee
  three/                 Hero WebGL scene and its GLSL
  components/            Page sections and case-study modals
```

### Design tokens

Token names are **roles, not materials**: `paper` is always the ground and `ink`
is always the figure. Because Tailwind v4 emits utilities as `var()` references,
the whole site flips theme by redefining those variables under
`[data-theme="dark"]` — there is not a single `dark:` variant in the markup.

Dark is not the light palette inverted. It is a warm near-black tinted toward
the same brown as the stock, with the spot lifted so it still reads as vermilion.

The theme is applied by an inline script in `<head>` before first paint, so
there is no flash. A stored choice wins; otherwise it follows the OS.

### Motion

Lenis is driven from GSAP's ticker rather than its own `requestAnimationFrame`
loop, so smooth scrolling and every ScrollTrigger share one clock. That is what
keeps pinned elements from jittering against the content scrolling past them.

All motion has a `prefers-reduced-motion` path — not a global "disable
animations" switch. Lenis is never constructed, the horizontal pin in
`WorkSection` is skipped via `gsap.matchMedia`, split-text reveals render as
plain visible text, and the custom cursor does not mount at all.

Entrance timelines carry a wall-clock failsafe. GSAP's ticker rides
`requestAnimationFrame`, which browsers suspend for hidden tabs; without the
timer, opening the site in a background tab and returning leaves the hero
permanently mid-animation.

### The hero scene

`@react-three/fiber` with hand-written GLSL, no post-processing:

- **Wordmark** — the name is rasterised to an offscreen canvas in the site's own
  display face, and every opaque glyph pixel becomes a particle target. The
  particles converge from a scattered cloud. Pointer proximity tints them toward
  the spot colour; it deliberately does **not** displace them, which tore a hole
  through the mark and the copy behind it.
- **Portrait** — a halftone plate. Ink density follows the image, screened
  through a rotated dot grid. The key inverts with the ground: shadows carry the
  ink on paper, highlights carry the light on dark.
- **Background cut is spatial, not tonal.** A luminance threshold cannot work on
  this source — the studio backdrop and the subject's own shadows share a range,
  so any cut dark enough to drop the backdrop also eats the face. An elliptical
  mask over the head separates them by geometry. Its centre is **measured** from
  the source image, not guessed; re-measure if the portrait is replaced.

Two constraints worth knowing before editing this scene:

1. **Uniforms must be reached through the material ref.** The object passed to
   `<shaderMaterial uniforms={...}>` is cloned during construction; mutating the
   local copy updates nothing. Rebuilding that object also rebuilds the
   material, which resets animation progress.
2. **Never lay out from R3F's `viewport`.** It derives from where the camera
   currently is, and this scene dollies the camera on scroll. Use
   `useStableViewport`, which computes extent from canvas size and a fixed rest
   distance.

### Audio

Sampled, not synthesised: a looping ambient bed plus interface sounds in
`public/audio`. Buffers are fetched and decoded on the first *enable*, so
nothing is downloaded for visitors who never turn sound on, and the
AudioContext is created on that same gesture because browsers refuse to start
one otherwise.

The source WAVs were 24-bit/96 kHz masters (1.5 MB). They are downconverted to
16-bit/48 kHz mono — inaudible difference on sub-second interface sounds, ~17%
of the size.

Hover sound is emitted from one global listener in `useUiSounds`, never from
individual components; attaching it in both places double-triggers on any
control that has its own hover behaviour.

### Bundle

Three.js is lazy and not in the entry chunk. Case-study modals and the system
drawer are separately split; the drawer prefetches on hover of the Menu button.

```
entry       ~141 kB gzip
react        ~43 kB gzip
three       ~190 kB gzip   (async, after first paint)
hero scene   ~57 kB gzip   (async)
```

## Content

Project figures, the contribution matrix, and the contact form are illustrative
— the form resolves client-side and does not post anywhere. Wire it to a real
endpoint before publishing.
