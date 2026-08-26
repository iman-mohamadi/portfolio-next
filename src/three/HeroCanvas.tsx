import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { LensField } from './LensField';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { perfTier } from '../lib/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { PointerRef, ScrollRef } from './types';

/**
 * Fixed full-viewport WebGL layer behind the hero — the site's only 3D scene.
 * Owns its own scroll and pointer refs so nothing in the render loop ever
 * triggers a React render.
 *
 * This renders for roughly the first two viewports of a page around nine
 * viewports long. That gate is the single decision that makes a dispersion
 * shader affordable at all; everything below the hero is DOM and GSAP.
 */
export default function HeroCanvas() {
  const scrollRef: ScrollRef = useRef(0);
  const pointerRef: PointerRef = useRef({ x: 0, y: 0, active: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const [active, setActive] = useState(true);

  const quality = useMemo(() => perfTier(), []);

  useGSAP(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // Spans the hero and the statement panel below it — two viewports — so the
    // slab has room to finish its travel while still on screen. Tying this to
    // the hero alone spends the whole crossing on a hero that is simultaneously
    // scrolling away.
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: () => `+=${window.innerHeight * 2}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });

    // Render gate. Deliberately a plain scroll-position check rather than the
    // trigger's own onToggle: the canvas mounts while the preloader still has
    // the body at `overflow: hidden`, so the document is not scrollable and the
    // trigger measures degenerately — isActive false, progress 1. That latches
    // the frameloop to "never" permanently, the scene draws one frame, and
    // every ramp stays frozen at zero. At scroll 0 this condition is
    // unambiguously true, so it cannot latch off at init.
    const visibility = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const visible = self.scroll() < window.innerHeight * 2.3;
        // React bails out when the value is unchanged, so this is cheap.
        setActive(visible);
        // Belt and braces on top of the shader's own alpha: `frameloop: never`
        // freezes the canvas on its last drawn frame rather than clearing it,
        // so anything short of full transparency at that instant would sit
        // composited over every section below.
        if (rootRef.current) {
          rootRef.current.style.visibility = visible ? 'visible' : 'hidden';
        }
      },
    });

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.y = (e.clientY / window.innerHeight - 0.5) * -2;
      pointerRef.current.active = true;
    };

    if (!reduced) window.addEventListener('pointermove', onPointerMove, { passive: true });

    // The hero must be readable before the glass arrives. The DOM copy is
    // already on screen; this brings the optic up underneath it.
    gsap.fromTo(
      rootRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.9, ease: 'arch', delay: 0.1 }
    );

    // Fade the optic out as the hero leaves.
    //
    // Without this the canvas held full opacity right up to the render gate at
    // 2.3 viewports and then vanished — so the wordmark stayed sitting on top
    // of the About section, and then popped. The sections below paint their
    // ground on ScrollBackdrop, *behind* this canvas, so nothing was ever going
    // to cover it: it has to take itself off screen.
    //
    // Tied to the statement panel's exit rather than the hero's, so the fade
    // runs over the same span the slab is still travelling across.
    const fade = gsap.to(rootRef.current, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: () => `${window.innerHeight * 1.25} top`,
        end: () => `${window.innerHeight * 1.95} top`,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
      // Critical: without this the tween captures and applies its start value
      // at creation time, which is while the entrance fade above still has the
      // layer at opacity 0 — the optic would then never become visible at all.
      immediateRender: false,
    });

    return () => {
      trigger.kill();
      visibility.kill();
      fade.scrollTrigger?.kill();
      fade.kill();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-0 pointer-events-none opacity-0" aria-hidden="true">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        // Clamped hard. The fragment shader is the expensive part and its cost
        // is per-pixel, so dpr is the single most effective quality dial here.
        dpr={[1, quality === 'high' ? 1.75 : 1.25]}
        // Nothing in this scene is projected, so the camera is inert — the quad
        // writes clip space directly. Declared only because R3F wants one.
        orthographic
        camera={{ position: [0, 0, 1], near: 0, far: 2 }}
        gl={{
          // FXAA is not needed either: there is no geometry edge in this scene,
          // only texture sampling, which is already filtered.
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        onCreated={({ gl }) => {
          // Transparent: the ground comes from the page behind the canvas, so the
          // DOM and the WebGL layer share one surface and one grain.
          gl.setClearColor(0x0d0d0d, 0);
        }}
      >
        <LensField scrollRef={scrollRef} pointerRef={pointerRef} quality={quality} />
      </Canvas>
    </div>
  );
}
