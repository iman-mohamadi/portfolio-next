import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Blob } from './Blob';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { damp, perfTier } from '../lib/motion';
import { CAMERA_REST_Z } from './useStableViewport';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { PointerRef, ScrollRef } from './types';

/** Eases the camera back and up as the hero scrolls away. */
function CameraRig({
  scrollRef,
  pointerRef,
}: {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = scrollRef.current;

    camera.position.x = damp(camera.position.x, pointerRef.current.x * 0.55, 2.5, dt);
    camera.position.y = damp(camera.position.y, pointerRef.current.y * 0.35 + s * 1.4, 2.5, dt);
    camera.position.z = damp(camera.position.z, CAMERA_REST_Z + s * 4.5, 2.5, dt);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Scene({
  scrollRef,
  pointerRef,
  quality,
}: {
  scrollRef: ScrollRef;
  pointerRef: PointerRef;
  quality: 'low' | 'mid' | 'high';
}) {
  return (
    <>
      <CameraRig scrollRef={scrollRef} pointerRef={pointerRef} />

      {/* One object, centred between the two display words. The wordmark and
          portrait shaders that used to live here are now studies in the Tools
          section, where they are the subject rather than the backdrop. */}
      <Blob scrollRef={scrollRef} pointerRef={pointerRef} quality={quality} />
    </>
  );
}

/**
 * Fixed full-viewport WebGL layer behind the hero. Owns its own scroll and
 * pointer refs so nothing in the 3D loop ever triggers a React render.
 */
export default function HeroCanvas() {
  const scrollRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Stop rendering entirely once the hero is off screen. A fixed canvas that
  // keeps drawing behind opaque sections is the most common perf leak in sites
  // like this one.
  const [active, setActive] = useState(true);

  const quality = useMemo(() => perfTier(), []);

  useGSAP(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });

    // Render gate. This used to hang off the trigger's own onToggle as
    // `isActive || progress < 1` — but the canvas mounts while the preloader
    // still has the body at `overflow: hidden`, so the document isn't
    // scrollable and the trigger measures degenerately: isActive false,
    // progress 1. That latched frameloop to "never" permanently, the scene
    // drew a single frame, and every useFrame-driven ramp (the wordmark
    // forming, the portrait fading up, the camera) stayed frozen at zero.
    //
    // A plain scroll-position check can't latch off at init, because at scroll
    // 0 the condition is unambiguously true.
    const visibility = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        // React bails out when the value is unchanged, so this is cheap.
        setActive(self.scroll() < window.innerHeight * 1.3);
      },
    });

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.y = (e.clientY / window.innerHeight - 0.5) * -2;
      pointerRef.current.active = true;
    };

    if (!reduced) window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Hero copy is the priority on first paint; bring the canvas up under it.
    gsap.fromTo(
      rootRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 2.4, ease: 'power2.out', delay: 0.15 }
    );

    return () => {
      trigger.kill();
      visibility.kill();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-0"
      aria-hidden="true"
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, quality === 'high' ? 2 : 1.5]}
        camera={{ position: [0, 0, 6.6], fov: 52, near: 0.1, far: 100 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          // Transparent: the ground comes from the page behind the canvas, so the
          // DOM and the WebGL layer share one surface and one grain.
          gl.setClearColor(0xe9e8e4, 0);
        }}
      >
        <Scene scrollRef={scrollRef} pointerRef={pointerRef} quality={quality} />
      </Canvas>
    </div>
  );
}
