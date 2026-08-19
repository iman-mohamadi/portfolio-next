import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useTheme } from '../hooks/useTheme';

interface NavbarProps {
  onOpenMenu: () => void;
  /** Warms the drawer's async chunk on hover/focus, before the click lands. */
  onPrefetchMenu: () => void;
  isAudioActive: boolean;
  toggleAudio: () => void;
}

const NAV_LINKS = [
  { id: 'work', label: 'Work' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMenu,
  onPrefetchMenu,
  isAudioActive,
  toggleAudio,
}) => {
  const headerRef = useRef<HTMLElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  // A masthead carries a date, not a ticking clock — the running UTC readout
  // belonged to the old system-telemetry voice.
  useEffect(() => {
    setTimeStr(
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;

    // Hide going down, reveal going up. Keeps the huge hero type unobstructed
    // while leaving navigation one gesture away at any depth.
    const show = gsap.quickTo(header, 'yPercent', { duration: 0.5, ease: 'arch' });

    const trigger = ScrollTrigger.create({
      start: 'top -120',
      end: 'max',
      onUpdate: (self) => {
        show(self.direction === 1 && self.scroll() > 200 ? -110 : 0);
      },
      onToggle: (self) => {
        gsap.to(header, {
          backgroundColor: self.isActive ? 'var(--color-paper)' : 'transparent',
          borderColor: self.isActive ? 'var(--color-rule)' : 'transparent',
          backdropFilter: self.isActive ? 'blur(14px)' : 'blur(0px)',
          paddingTop: self.isActive ? 16 : 28,
          paddingBottom: self.isActive ? 16 : 28,
          duration: 0.5,
          ease: 'arch',
        });
      },
    });

    return () => trigger.kill();
  }, []);

  const { scrollTo } = useSmoothScroll();

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-transparent py-7 px-6 md:px-12 flex items-center justify-between gap-6 will-change-transform"
    >
      <div className="flex items-center gap-6">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('#hero');
          }}
          className="text-ink flex items-baseline gap-3 group"
          data-cursor="active"
        >
          <span className="font-display text-base sm:text-lg leading-none whitespace-nowrap group-hover:text-spot transition-colors duration-500">
            Iman Mohammadi
          </span>
        </a>

        <span className="hidden xl:inline-flex items-center label text-ink-faint pl-4 border-l border-rule">
          {timeStr}
        </span>
      </div>

      <nav aria-label="Primary" className="hidden md:flex items-center gap-10 lg:gap-12">
        {NAV_LINKS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(`#${id}`)}
            className="text-ink-soft hover:text-spot text-xs uppercase tracking-[0.25em] transition-colors duration-500 link-underline"
            data-cursor="active"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          className="px-4 py-2.5 border border-rule text-ink-faint hover:text-ink hover:border-ink transition-colors duration-500 justify-center"
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          data-cursor="active"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Moon className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span className="sr-only">
            {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          </span>
        </button>

        <button
          onClick={toggleAudio}
          aria-pressed={isAudioActive}
          className={`px-3 py-2.5 text-xs transition-colors duration-500 flex items-center gap-2 border ${
            isAudioActive
              ? 'text-spot bg-spot/10 border-spot'
              : 'text-ink-faint hover:text-ink border-rule'
          }`}
          title={isAudioActive ? 'Mute sound' : 'Enable sound'}
          data-cursor="active"
        >
          {isAudioActive ? (
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
          )}

          {/* Live equaliser — unambiguous proof the toggle did something */}
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
          className="group text-xs uppercase tracking-[0.25em] text-ink hover:text-spot border border-rule hover:border-spot px-4 py-2.5 transition-colors duration-500 flex items-center gap-2.5"
          data-cursor="active"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-3.5 h-px bg-current transition-transform duration-500 group-hover:translate-x-0.5" />
            <span className="block w-3.5 h-px bg-current transition-transform duration-500 group-hover:-translate-x-0.5" />
          </span>
          Menu
        </button>
      </div>
    </header>
  );
};
