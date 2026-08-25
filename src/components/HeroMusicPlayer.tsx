import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Track {
  src: string;
  label: string;
}

// Generated placeholder loops — drop real MP3s in /public/music and list them
// here to replace the sound without touching the player.
const TRACKS: Track[] = [
  { src: '/music/loop-ink.wav', label: 'Studio Loop — Ink' },
  { src: '/music/loop-vermilion.wav', label: 'Studio Loop — Vermilion' },
  { src: '/music/loop-paper.wav', label: 'Studio Loop — Paper' },
];

/**
 * The hero's music player, matching the reference: a hairline track with a
 * fill and a square puck, a play/pause toggle, a "Press play" label that
 * becomes the track name, and a short playlist that unfolds on hover.
 *
 * Progress is painted from a rAF loop straight to the DOM — timeupdate only
 * fires a few times a second and makes the puck stutter.
 */
export const HeroMusicPlayer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  // Paint loop, alive only while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const paint = () => {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        const pct = audio.currentTime / audio.duration;
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${pct})`;
        if (puckRef.current) puckRef.current.style.left = `${pct * 100}%`;
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const play = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = TRACKS[index];
    if (!audio.src.endsWith(track.src)) audio.src = track.src;
    audio.volume = 0.55;
    setCurrent(index);
    audio
      .play()
      .then(() => setPlaying(true))
      // A missing file or blocked autoplay just leaves the player idle.
      .catch(() => setPlaying(false));
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      play(current);
    }
  }, [playing, current, play]);

  const seek = useCallback((e: React.MouseEvent) => {
    const audio = audioRef.current;
    const line = lineRef.current;
    if (!audio || !line || !audio.duration) return;
    const rect = line.getBoundingClientRect();
    audio.currentTime =
      Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * audio.duration;
  }, []);

  return (
    <div className={`music-player group ${className}`}>
      {/* Track line: rule + fill + puck. Click to seek. */}
      <div
        ref={lineRef}
        className="relative w-40 h-3 cursor-pointer"
        onClick={seek}
        role="slider"
        aria-label="Track position"
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={-1}
      >
        <div className="absolute left-0 right-0 top-1/2 h-px bg-ink/40" />
        <div
          ref={fillRef}
          className="absolute left-0 right-0 top-1/2 h-px bg-spot origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
        <span
          ref={puckRef}
          className="absolute top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-ink"
          style={{ left: '0%' }}
        />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={toggle}
          className="w-4 h-4 flex items-center justify-center text-spot"
          aria-label={playing ? 'Pause music' : `Play ${TRACKS[current].label}`}
          data-cursor="active"
        >
          {playing ? (
            <span className="flex gap-[3px]" aria-hidden="true">
              <span className="block w-[3px] h-3 bg-current" />
              <span className="block w-[3px] h-3 bg-current" />
            </span>
          ) : (
            <span
              className="block w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-current"
              aria-hidden="true"
            />
          )}
        </button>
        <button type="button" onClick={toggle} className="label text-ink" data-cursor="active">
          {playing ? TRACKS[current].label : 'Press play'}
        </button>
      </div>

      {/* Playlist, unfolded while the player is hovered or focused. */}
      <div className="music-playlist mt-2 space-y-1">
        {TRACKS.map((track, i) => (
          <button
            key={track.src}
            type="button"
            onClick={() => play(i)}
            className={`flex items-center gap-2 label transition-opacity ${
              i === current ? 'text-ink' : 'text-ink-faint hover:text-ink'
            }`}
            data-cursor="active"
          >
            <span
              className={`block h-px w-5 ${i === current ? 'bg-spot' : 'bg-ink/40'}`}
              aria-hidden="true"
            />
            {track.label}
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        src={TRACKS[0].src}
        onEnded={() => play((current + 1) % TRACKS.length)}
      />
    </div>
  );
};
