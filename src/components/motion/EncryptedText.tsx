import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface EncryptedTextProps {
  text: string;
  className?: string;
  /** Milliseconds before each successive character locks to its real value. */
  revealDelayMs?: number;
  /** Milliseconds between re-rolls of the still-scrambled characters. */
  flipDelayMs?: number;
  charset?: string;
}

// Uniform-width glyphs only: mixing narrow and wide characters makes the label
// jitter as it decodes.
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const randomChar = (charset: string) =>
  charset.charAt(Math.floor(Math.random() * charset.length));

/**
 * Decodes its label out of scrambled glyphs on hover.
 *
 * Ported from the EncryptedText component in Raya UI, keeping its timing model:
 * a reveal cursor walks left to right at `revealDelayMs` per character while
 * everything ahead of it re-rolls every `flipDelayMs`.
 *
 * The real text is always present in the DOM — the scrambled copy is
 * `aria-hidden`, so assistive tech and search engines only ever see the label,
 * never the gibberish.
 *
 * The hover sound is NOT fired here: useUiSounds already plays one globally for
 * every interactive element, and doing both double-triggered on these links.
 */
export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className = '',
  revealDelayMs = 50,
  flipDelayMs = 40,
  charset = CHARSET,
}) => {
  const [scrambled, setScrambled] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const reduced = useReducedMotion();

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    runningRef.current = false;
    setScrambled(null);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (reduced || runningRef.current) return;
    runningRef.current = true;

    const chars = text.split('');
    let current = chars.map((c) => (c === ' ' ? ' ' : randomChar(charset)));
    const startTime = performance.now();
    let lastFlip = startTime;

    const update = (now: number) => {
      const revealed = Math.min(
        chars.length,
        Math.floor((now - startTime) / Math.max(1, revealDelayMs))
      );

      if (revealed >= chars.length) {
        runningRef.current = false;
        frameRef.current = null;
        setScrambled(null);
        return;
      }

      if (now - lastFlip >= flipDelayMs) {
        current = current.map((_, i) => {
          if (i < revealed) return chars[i];
          if (chars[i] === ' ') return ' ';
          return randomChar(charset);
        });
        lastFlip = now;
        setScrambled(current.join(''));
      }

      frameRef.current = requestAnimationFrame(update);
    };

    setScrambled(current.join(''));
    frameRef.current = requestAnimationFrame(update);
  }, [text, charset, revealDelayMs, flipDelayMs, reduced]);

  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={start}>
      {/* Real text: holds the box, and is the only copy exposed to a11y. */}
      <span className={scrambled ? 'invisible whitespace-pre' : 'whitespace-pre'}>{text}</span>

      {scrambled && (
        <span className="absolute inset-0 whitespace-pre" aria-hidden="true">
          {scrambled}
        </span>
      )}
    </span>
  );
};
