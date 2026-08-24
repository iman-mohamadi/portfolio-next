import React, { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { EncryptedText } from './motion/EncryptedText';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { playSfx } from '../utils/audioSynth';
import { CONTACT_PORTRAIT } from '../content/media';

const EMAIL = 'im.enzo.021@gmail.com';

const CHANNELS = [
  { label: 'GitHub', handle: '@iman-mohamadi', href: 'https://github.com/iman-mohamadi' },
  {
    label: 'LinkedIn',
    handle: 'iman-mohammadiii',
    href: 'https://www.linkedin.com/in/iman-mohammadiii/',
  },
  { label: 'Instagram', handle: '@im_mhmdi', href: 'https://instagram.com/im_mhmdi' },
];

/**
 * The sign-off: the full-bleed orange returns, the portrait is blended into it
 * rather than framed, and the email is set at display scale because it is the
 * only action on the page that matters.
 */
export const ContactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      playSfx('success');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard is permission-gated and blocked outside a secure context.
      // The mailto link beside this is the fallback, so there is nothing to
      // recover from — just leave the label alone.
    }
  };

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from('.contact-line', {
        yPercent: 105,
        duration: 1.2,
        ease: 'arch',
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 68%', once: true },
      });

      gsap.from('.contact-meta', {
        opacity: 0,
        y: 22,
        duration: 0.9,
        ease: 'arch',
        stagger: 0.07,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 55%', once: true },
      });

      gsap.to('.contact-portrait', {
        yPercent: -10,
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
      className="bleed-spot relative z-20 overflow-hidden pt-24 md:pt-36 pb-16 md:pb-20 px-6 md:px-10"
    >
      {/* Portrait dissolved into the ground rather than framed on it.
          Deliberately a mask and not a blend mode: the ground is painted by
          the fixed ScrollBackdrop layer, and this section opens its own
          stacking context, so `mix-blend-screen` had nothing to blend against
          and the plate re-appeared as a hard-edged rectangle. A mask needs no
          backdrop and works on whatever colour is behind it. */}
      <div
        className="contact-portrait pointer-events-none absolute right-0 bottom-0 w-[62%] sm:w-[46%] lg:w-[34%] max-w-[560px] opacity-45"
        aria-hidden="true"
      >
        <img
          src={CONTACT_PORTRAIT}
          alt=""
          loading="lazy"
          className="portrait-fade w-full h-auto object-contain grayscale contrast-[1.35]"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-14 md:mb-20">
          <span className="label">[ Contact ]</span>
          <span className="rule-h flex-1" />
          <span className="label flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#0a0a0a]" aria-hidden="true" />
            Available for 2026
          </span>
        </div>

        <h2 className="display text-[clamp(2.75rem,11.5vw,11rem)] mb-12 md:mb-16">
          <span className="split-line-mask block">
            <span className="contact-line block">Let&apos;s</span>
          </span>
          <span className="split-line-mask block">
            <span className="contact-line block">create</span>
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12 items-start">
          <div className="lg:col-span-7">
            <p className="contact-meta label mb-4">Write to me</p>

            <a
              href={`mailto:${EMAIL}`}
              className="contact-meta block font-mono-tech text-[clamp(1rem,3.4vw,2.1rem)] tracking-tight break-all link-underline"
              data-cursor="active"
            >
              {EMAIL}
            </a>

            <div className="contact-meta flex flex-wrap items-center gap-3 mt-8">
              <a href={`mailto:${EMAIL}`} className="btn-box" data-cursor="active">
                <span className="w-1.5 h-1.5 bg-[#0a0a0a]" aria-hidden="true" />
                <EncryptedText text="Start a project" />
              </a>
              <button onClick={handleCopy} className="btn-box" data-cursor="active">
                {copied ? 'Copied' : 'Copy address'}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copied ? 'Email address copied to clipboard' : ''}
              </span>
            </div>

            <p className="contact-meta max-w-[32rem] mt-10 text-sm md:text-base leading-relaxed opacity-80">
              Open to product work, design-system builds, and the occasional
              experiment that has no business being in a browser. Tehran time,
              flexible hours, replies within a day.
            </p>
          </div>

          {/* Channels */}
          <div className="lg:col-span-5">
            <p className="contact-meta label mb-4">Elsewhere</p>
            <ul>
              {CHANNELS.map((channel) => (
                <li key={channel.label} className="contact-meta border-t border-[#0a0a0a]/28 last:border-b">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-baseline justify-between gap-6 py-5"
                    data-cursor="active"
                  >
                    <span className="row-title transition-transform duration-500 ease-out md:group-hover:translate-x-2">
                      <EncryptedText text={channel.label} />
                    </span>
                    <span className="label whitespace-nowrap">{channel.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
