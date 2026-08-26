import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { isTouch } from '../lib/motion';

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [data-cursor], .sweep-row';

/**
 * Largest control whose bounding box the ring will adopt. Past this the ring
 * stops reading as a cursor and starts reading as a selection rectangle.
 */
const MAX_ADOPT_W = 340;
const MAX_ADOPT_H = 120;

/**
 * The aperture cursor.
 *
 * Two parts: a point locked to the pointer and a ring that lags behind it. The
 * lag is the whole effect — a ring that tracks perfectly is a crosshair, a ring
 * that catches up is an instrument settling.
 *
 * Everything runs through `gsap.quickTo` against the DOM directly. An earlier
 * implementation set React state on every mousemove, which re-rendered the
 * component tree at pointer frequency.
 *
 * The one real change from a conventional custom cursor: over an interactive
 * element the ring does not scale by a fixed factor, it *adopts that element's
 * bounding box*. A fixed scale is too small on a wide button and absurd on a
 * small icon; adopting the box means the ring always frames exactly what
 * activating it would hit, which is useful rather than only decorative.
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label || reduced || isTouch()) return;

    document.documentElement.classList.add('has-custom-cursor');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    // The ring's longer duration is the effect: it lags, then catches up.
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

    let visible = false;
    // While the ring has adopted an element's box it tracks that element's
    // centre, not the pointer — otherwise the box drifts off the thing it is
    // framing as the pointer moves around inside it.
    let anchored: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      }
      dotX(e.clientX);
      dotY(e.clientY);

      if (anchored) {
        const r = anchored.getBoundingClientRect();
        ringX(r.left + r.width / 2);
        ringY(r.top + r.height / 2);
      } else {
        ringX(e.clientX);
        ringY(e.clientY);
      }
    };

    const onOver = (e: PointerEvent) => {
      let target = (e.target as HTMLElement)?.closest?.(
        INTERACTIVE_SELECTOR
      ) as HTMLElement | null;
      const text = target?.getAttribute('data-cursor-text') ?? '';
      const overHero = !!(e.target as HTMLElement)?.closest?.('#hero');

      // Only *small* controls get their box adopted.
      //
      // Adopting anything is wrong past a certain size: a full-width list row
      // turns the ring into a rectangle most of the viewport across, which
      // stops reading as a cursor entirely, and because the ring lerps at
      // 0.55s it then takes most of a second to crawl back. Buttons and links
      // benefit from the frame; a row does not need one, because it already
      // has its own hover state.
      let adopt = false;
      if (target) {
        const r = target.getBoundingClientRect();
        adopt = r.width <= MAX_ADOPT_W && r.height <= MAX_ADOPT_H;
        if (adopt) {
          gsap.to(ring, {
            width: r.width + 16,
            height: r.height + 16,
            duration: 0.45,
            ease: 'lift',
          });
        }
      }

      // Anchoring only makes sense while the ring is framing something. Left
      // set on a big row, it also pinned the ring to that row's centre, so the
      // cursor stopped following the pointer at all.
      anchored = adopt ? target : null;

      if (!adopt) {
        // Resting geometry — or, over the hero, dilated like an aperture.
        const size = overHero ? 96 : target ? 48 : 32;
        gsap.to(ring, {
          width: size,
          height: size,
          duration: overHero ? 0.64 : 0.45,
          ease: overHero ? 'archInOut' : 'lift',
        });
      }

      // Colour is a class, not a tween: the cursor sits over two very
      // different grounds and the legible colour for each is already published
      // as `--on-ground` by ScrollBackdrop. Tweening a hardcoded rgba here was
      // why the dot vanished the moment it crossed onto the orange.
      ring.classList.toggle('is-over', !!target);
      dot.classList.toggle('is-over', !!target);

      gsap.to(dot, { scale: adopt ? 0 : 1, duration: 0.35, ease: 'lift' });

      label.textContent = text;
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25 });
    };

    // The site's only overshoot, at ~3% via back.out. A single point of
    // elasticity in an otherwise entirely rigid system reads as precision; a
    // second one anywhere would read as inconsistency.
    const onDown = () => gsap.to(ring, { scale: 0.9, duration: 0.14, ease: 'lift' });
    const onUp = () =>
      gsap.to(ring, { scale: 1, duration: 0.42, ease: 'back.out(1.6)', overwrite: 'auto' });

    const onLeave = () => {
      visible = false;
      anchored = null;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      {/* Colours come from `--on-ground`, which the backdrop rewrites as it
          crosses between the dark ground and the orange one. A fixed colour
          cannot work here: anything legible on #0d0d0d disappears on #ff6a30,
          and vice versa. */}
      <div
        ref={ringRef}
        className="cursor-ring absolute top-0 left-0 w-8 h-8 rounded-full border flex items-center justify-center opacity-0 will-change-transform"
      >
        <span
          ref={labelRef}
          className="cursor-label text-[7px] tracking-[0.2em] uppercase opacity-0 whitespace-nowrap"
        />
      </div>
      <div
        ref={dotRef}
        className="cursor-dot absolute top-0 left-0 w-1.5 h-1.5 rounded-full opacity-0 will-change-transform"
      />
    </div>
  );
};
