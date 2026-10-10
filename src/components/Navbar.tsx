import React, { useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { EncryptedText } from './motion/EncryptedText';

interface NavbarProps {
  onOpenMenu: () => void;
  onPrefetchMenu: () => void;
  isAudioActive: boolean;
  toggleAudio: () => void;
}

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'tools', label: 'Tools' },
  { id: 'work', label: 'Work' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMenu,
  onPrefetchMenu,
  isAudioActive,
  toggleAudio,
}) => {
  const headerRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;

    // Hide going down, reveal going up — the display type needs the full frame.
    const show = gsap.quickTo(header, 'yPercent', { duration: 0.5, ease: 'arch' });

    const trigger = ScrollTrigger.create({
      start: 'top -120',
      end: 'max',
      onUpdate: (self) => {
        show(self.direction === 1 && self.scroll() > 200 ? -130 : 0);
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between gap-4 will-change-transform bg-paper/80 backdrop-blur-md border-b border-rule"
    >
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollTo('#hero');
        }}
        className="label text-ink"
        data-cursor="active"
      >
        <EncryptedText text="Iman Mohammadi" />
      </a>

      <nav aria-label="Primary" className="hidden md:flex items-center gap-10">
        {NAV_LINKS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(`#${id}`)}
            className="label text-ink link-underline"
            data-cursor="active"
          >
            <EncryptedText text={label} />
          </button>
        ))}
        <button
          onClick={() => scrollTo('#contact')}
          className="label text-ink flex items-center gap-2"
          data-cursor="active"
        >
          <EncryptedText text="Let's create" />
          <span className="w-2 h-2 bg-neon led-pulse" aria-hidden="true" />
        </button>
      </nav>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleAudio}
          aria-pressed={isAudioActive}
          className="label text-ink flex items-center gap-1.5 p-1"
          title={isAudioActive ? 'Mute sound' : 'Enable sound'}
          data-cursor="active"
        >
          {isAudioActive ? (
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-[2px] bg-current transition-all duration-300 ${
                  isAudioActive ? 'eq-bar' : 'h-[3px] opacity-40'
                }`}
                style={isAudioActive ? { animationDelay: `${i * 0.13}s` } : undefined}
              />
            ))}
          </span>
          <span className="sr-only">{isAudioActive ? 'Mute sound' : 'Enable sound'}</span>
        </button>

        <button
          onClick={onOpenMenu}
          onMouseEnter={onPrefetchMenu}
          onFocus={onPrefetchMenu}
          aria-haspopup="dialog"
          className="md:hidden label text-ink flex items-center gap-2 p-1"
          data-cursor="active"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-4 h-px bg-current" />
            <span className="block w-4 h-px bg-current" />
          </span>
          <span className="sr-only">Open menu</span>
        </button>
      </div>
    </header>
  );
};
