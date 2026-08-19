import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SmoothScrollApi {
  /** Scroll to an element id or absolute offset. Falls back to native when Lenis is off. */
  scrollTo: (target: string | number, options?: { offset?: number; immediate?: boolean }) => void;
  /** Freeze scrolling — used by modals and the drawer so the page can't drift behind them. */
  setLocked: (locked: boolean) => void;
  /** Live signed scroll velocity, read imperatively from rAF loops (never triggers renders). */
  velocityRef: React.MutableRefObject<number>;
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

export const useSmoothScroll = (): SmoothScrollApi => {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error('useSmoothScroll must be used inside <SmoothScrollProvider>');
  return ctx;
};

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const velocityRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const [lockCount, setLockCount] = useState(0);

  useEffect(() => {
    // Reduced motion: no inertia at all. Native scrolling only, ScrollTrigger
    // still works off the real scroll position.
    if (reducedMotion) {
      document.documentElement.style.scrollBehavior = 'auto';
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Expo-out: fast pickup, long glide, no visible tail bounce.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
      // Native momentum on touch feels better than emulated inertia.
      syncTouch: false,
    });
    lenisRef.current = lenis;

    const onScroll = ({ velocity }: { velocity: number }) => {
      velocityRef.current = velocity;
      ScrollTrigger.update();
    };
    lenis.on('scroll', onScroll);

    // Drive Lenis from GSAP's ticker so scroll and tweens share one clock —
    // this is what removes the sub-frame jitter between pinned elements and content.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Nested locks (modal opened over a drawer) must not unlock early, so count them.
  useEffect(() => {
    const locked = lockCount > 0;
    const lenis = lenisRef.current;

    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    }
    document.body.style.overflow = locked && !lenis ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [lockCount]);

  const setLocked = useCallback((locked: boolean) => {
    setLockCount((n) => Math.max(0, n + (locked ? 1 : -1)));
  }, []);

  const scrollTo = useCallback<SmoothScrollApi['scrollTo']>((target, options) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.immediate ? 0 : 1.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
      return;
    }

    const el = typeof target === 'string' ? document.querySelector(target) : null;
    const top = typeof target === 'number' ? target : (el?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo({ top: top + (options?.offset ?? 0), behavior: 'auto' });
  }, []);

  const api = useMemo(() => ({ scrollTo, setLocked, velocityRef }), [scrollTo, setLocked]);

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
};

/** Declarative scroll lock: mount-with-`active` freezes the page, unmount restores it. */
export function useScrollLock(active: boolean) {
  const { setLocked } = useSmoothScroll();
  useEffect(() => {
    if (!active) return;
    setLocked(true);
    return () => setLocked(false);
  }, [active, setLocked]);
}
