import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { SmoothScrollProvider } from './providers/SmoothScrollProvider';
import { ScrollTrigger } from './lib/gsap';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgress } from './components/ScrollProgress';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ManifestoSection } from './components/ManifestoSection';
import { WorkSection } from './components/WorkSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { setAudioEnabled } from './utils/audioSynth';
import { useUiSounds } from './hooks/useUiSounds';

// Three.js is the heaviest thing on the page and nothing above the fold needs
// it to render. Split it out of the entry bundle so first paint isn't waiting
// on a renderer.
const HeroCanvas = lazy(() => import('./three/HeroCanvas'));

// The drawer owns the only remaining static dependency on the animation
// runtime used by the modals. Splitting it keeps that runtime out of the entry
// bundle; the hover/focus preload below means it is already cached by the time
// anyone actually clicks Menu.
const loadDrawer = () => import('./components/SystemDrawer');
const SystemDrawer = lazy(() =>
  loadDrawer().then((m) => ({ default: m.SystemDrawer }))
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Sticky: once the drawer has been opened it stays mounted, so its close
  // animation can play out instead of the element vanishing.
  const [drawerMounted, setDrawerMounted] = useState(false);

  const openMenu = useCallback(() => {
    setDrawerMounted(true);
    setIsMenuOpen(true);
  }, []);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [ready, setReady] = useState(false);

  // The side effect must live outside the updater: StrictMode invokes updaters
  // twice, which would start two copies of the audio graph.
  const handleToggleAudio = useCallback(() => {
    const next = !isAudioActive;
    setAudioEnabled(next);
    setIsAudioActive(next);
  }, [isAudioActive]);

  useUiSounds(isAudioActive);

  // Hold the page at the top while the preloader is up, so the reveal always
  // starts from the hero even on a restored scroll position.
  useEffect(() => {
    if (ready) return;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [ready]);

  const handleLoaded = useCallback(() => {
    setReady(true);
    // Layout shifted as the loader unmounted; re-measure every pin and trigger.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <SmoothScrollProvider>
      <a href="#main" className="skip-link bg-ink text-paper px-5 py-3 label">
        Skip to content
      </a>

      <Preloader onComplete={handleLoaded} />

      <Suspense fallback={null}>{ready && <HeroCanvas />}</Suspense>

      <CustomCursor />

      <Navbar
        onOpenMenu={openMenu}
        onPrefetchMenu={loadDrawer}
        isAudioActive={isAudioActive}
        toggleAudio={handleToggleAudio}
      />

      <ScrollProgress />

      <main id="main" className="relative z-10 w-full">
        <HeroSection ready={ready} />
        <ManifestoSection />
        <WorkSection />
        <CapabilitiesSection />
        <ContactSection />
      </main>

      <Footer />

      <Suspense fallback={null}>
        {drawerMounted && (
          <SystemDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        )}
      </Suspense>

      {/* Paper stock: one tooth and one edge bleed over the whole page, so the
          WebGL canvas and the DOM read as a single printed surface. */}
      <div className="page-edge" aria-hidden="true" />
      <div className="paper-grain" aria-hidden="true" />
    </SmoothScrollProvider>
  );
}
