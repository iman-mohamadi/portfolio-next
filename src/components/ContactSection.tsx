import React, { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { EncryptedText } from './motion/EncryptedText';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { playSfx } from '../utils/audioSynth';
import { CONTACT_PORTRAIT } from '../content/media';

const EMAIL = 'im.enzo.021@gmail.com';

const LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Tools', id: 'tools' },
  { label: 'Work', id: 'work' },
  { label: "Let's create", id: 'contact' },
];

const CHANNELS = [
  { label: 'GitHub', href: 'https://github.com/iman-mohamadi' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/iman-mohammadiii/' },
  { label: 'Instagram', href: 'https://instagram.com/im_mhmdi' },
];

/**
 * The sign-off, laid out as a bordered three-panel plate on the orange: the
 * ask on the left with the portrait under it, navigation in the middle, and
 * the ways to reach me on the right.
 */
export const ContactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [from, setFrom] = useState('');
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      playSfx('success');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard is permission-gated and blocked outside a secure context.
      // The address is written out in full beside this, so there is nothing
      // to recover from.
    }
  };

  // No backend to post to, so this hands off to the visitor's mail client
  // with the reply address already filled in rather than pretending to send.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reply = from.trim();
    const body = reply ? `\n\n—\nReply to: ${reply}` : '';
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      'Project enquiry'
    )}&body=${encodeURIComponent(body)}`;
  };

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.contact-line', {
        yPercent: 104,
        duration: 1.1,
        ease: 'arch',
        stagger: 0.09,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 68%', once: true },
      });

      gsap.from('.contact-panel', {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'arch',
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', once: true },
      });

      // Drifts against the section's travel so the portrait sits behind the
      // plate rather than moving with it.
      gsap.to('.contact-portrait', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: sectionRef, dependencies: [reduced] }
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-label="Contact"
      className="bleed-spot relative z-20 overflow-hidden flex items-center px-6 md:px-10 pt-16 md:pt-20 pb-24 md:pb-32"
    >
      {/* Portrait bled off the bottom-right of the whole section rather than
          boxed inside a panel — the plate's cells have no background of their
          own, so it reads through them as part of the ground. Masked rather
          than blended: the ground is painted by the fixed backdrop layer and
          this section opens its own stacking context, so a blend mode would
          have nothing behind it to blend with. */}
      {/* Narrower at `lg` than it was, and sitting on the section floor rather
          than 32px below it. The source is 848x1264, so width dictates height:
          at 38% the image stood ~723px tall inside a ~715px section with
          `overflow-hidden`, and the head was the part that got cut. 33% keeps
          the whole figure inside the frame at this breakpoint. */}
      <div
        className="contact-portrait pointer-events-none absolute right-0 bottom-0 z-0 w-[78%] sm:w-[48%] lg:w-[33%] max-w-[540px]"
        aria-hidden="true"
      >
        <img
          src={CONTACT_PORTRAIT}
          alt=""
          loading="lazy"
          className="portrait-fade w-full h-auto object-contain grayscale contrast-[1.35] opacity-55"
        />
      </div>

      <div className="plate-frame relative z-10 w-full border border-[#0a0a0a]/85">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* The ask */}
          <div className="contact-panel p-7 md:p-10 border-b lg:border-b-0 lg:border-r border-[#0a0a0a]/85 flex flex-col">
            {/* Sized so each authored line actually fits the column — at 4.6vw
                "Let's build" wrapped and the three lines became five. */}
            <h2 className="display text-[clamp(1.6rem,3vw,2.5rem)] leading-[0.92] mb-5">
              {["Let's build", 'your next', 'thing.'].map((line) => (
                <span key={line} className="split-line-mask block">
                  <span className="contact-line block">{line}</span>
                </span>
              ))}
            </h2>

            <p className="label leading-relaxed max-w-[22rem]">
              Product work, design systems, and the occasional experiment that has
              no business being in a browser. Tehran time, replies within a day.
            </p>
          </div>

          {/* Navigation */}
          <div className="contact-panel p-7 md:p-10 border-b lg:border-b-0 lg:border-r border-[#0a0a0a]/85">
            <h3 className="font-display font-bold text-xl mb-7">Links</h3>
            <ul className="space-y-3">
              {LINKS.map(({ label, id }) => (
                <li key={label}>
                  <button
                    onClick={() => scrollTo(`#${id}`)}
                    className="label link-underline"
                    data-cursor="active"
                  >
                    <EncryptedText text={label} />
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="label mt-12 mb-3">Availability</h3>
            <p className="label flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#0a0a0a]" aria-hidden="true" />
              Open for 2026
            </p>
          </div>

          {/* Reach */}
          <div className="contact-panel p-7 md:p-10">
            <h3 className="font-display font-bold text-xl mb-7">Contact</h3>
            <ul className="space-y-3">
              {CHANNELS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="label link-underline"
                    data-cursor="active"
                  >
                    <EncryptedText text={label} />
                  </a>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="mt-12">
              <label htmlFor="reply-to" className="label block mb-2">
                Your email
              </label>
              <div className="flex items-center gap-3 border-b border-[#0a0a0a]/60 pb-2">
                <input
                  id="reply-to"
                  type="email"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="you@studio.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent border-0 outline-none label placeholder:opacity-65 py-1"
                />
                <button type="submit" className="label link-underline" data-cursor="active">
                  <EncryptedText text="Send" />
                </button>
              </div>
              {/* Kept near-full strength: this sits over the portrait, which
                  darkens the orange behind it, and at 60% it disappeared. */}
              <p className="label opacity-85 mt-2">Opens your mail app.</p>
            </form>

            <div className="mt-10 pt-6 border-t border-[#0a0a0a]/30">
              {/* Wrapper, because `.link-underline` sets inline-block and wins
                  over the utility — without it the button rides up onto the
                  same line and overlaps the address. */}
              <div>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-mono-tech text-[clamp(0.8rem,1.5vw,1.05rem)] break-all link-underline"
                  data-cursor="active"
                >
                  {EMAIL}
                </a>
              </div>
              <button onClick={handleCopy} className="btn-box mt-4" data-cursor="active">
                {copied ? 'Copied' : 'Copy address'}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copied ? 'Email address copied to clipboard' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
