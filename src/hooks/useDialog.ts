import { useEffect, useRef } from 'react';
import { useScrollLock } from '../providers/SmoothScrollProvider';
import { playSfx } from '../utils/audioSynth';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Everything a modal overlay owes the keyboard: Escape to dismiss, focus moved
 * in on open and restored on close, Tab cycling kept inside, and the page behind
 * frozen so it can't scroll away underneath.
 *
 * Returns a ref to spread onto the dialog container.
 */
export function useDialog(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    playSfx('open');

    // Focus the container itself rather than the first control — screen readers
    // then announce the dialog before its contents.
    const container = containerRef.current;
    container?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      playSfx('close');
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return containerRef;
}
