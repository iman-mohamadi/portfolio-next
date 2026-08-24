import React from 'react';

/**
 * Crosshair register marks pinned to the frame corners and edge midpoints — the
 * marks a printer uses to align plates. Fixed rather than per-section, so they
 * read as the page's frame and stay put while content scrolls beneath.
 */
export const RegistrationMarks: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none">
    <span className="reg-mark left-3 top-3" />
    <span className="reg-mark right-3 top-3" />
    <span className="reg-mark left-3 bottom-3" />
    <span className="reg-mark right-3 bottom-3" />
    <span className="reg-mark left-1/2 top-3 -translate-x-1/2" />
    <span className="reg-mark left-1/2 bottom-3 -translate-x-1/2" />
  </div>
);
