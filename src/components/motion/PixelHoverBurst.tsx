import React, { useMemo } from 'react';

interface PixelHoverBurstProps {
  cols?: number;
  rows?: number;
}

/**
 * A scattered flash of spot-coloured cells over a media frame, played once
 * whenever the surrounding `.pixel-hover-host` is hovered — the reference's
 * media-hover-pixels. Pure CSS from here on: the component only lays out the
 * grid and deals each cell a stable random delay.
 */
export const PixelHoverBurst: React.FC<PixelHoverBurstProps> = ({ cols = 8, rows = 5 }) => {
  const delays = useMemo(
    () => Array.from({ length: cols * rows }, () => (Math.random() * 0.28).toFixed(3)),
    [cols, rows]
  );

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
      {delays.map((delay, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <span
            key={i}
            className="pixel-hover-cell"
            style={{
              left: `${(c / cols) * 100}%`,
              top: `${(r / rows) * 100}%`,
              width: `calc(${100 / cols}% + 1px)`,
              height: `calc(${100 / rows}% + 1px)`,
              ['--pixel-hover-delay' as string]: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};
