import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, ShieldAlert, Cpu, Copy, Check } from 'lucide-react';
import { ContactFormData } from '../types';
import { Reveal } from './motion/Reveal';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { playSfx } from '../utils/audioSynth';
import { CONTACT_PORTRAIT } from '../content/media';

const EMAIL = 'Im.EnzO.021@gmail.com';

const FIELDS = [
  { name: 'name', type: 'text', label: 'Name', placeholder: 'Name', autoComplete: 'name' },
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Email', autoComplete: 'email' },
  {
    name: 'parameters',
    type: 'text',
    label: 'Project parameters',
    placeholder: 'What are you building?',
    autoComplete: 'off',
  },
] as const;

export const ContactSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    parameters: '',
  });
  const [status, setStatus] = useState<'idle' | 'transmitting' | 'sent' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.parameters.trim()) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3500);
      return;
    }

    setStatus('transmitting');
    setTimeout(() => {
      setStatus('sent');
      playSfx('success');
      if (!reduced) {
        confetti({
          particleCount: 70,
          spread: 62,
          origin: { y: 0.8 },
          colors: ['#C1440E', '#C1440E', '#14110F'],
          disableForReducedMotion: true,
        });
      }
    }, 1200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked by permissions; the mailto link below still works.
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-label="Contact"
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-paper py-28 md:py-36 border-t border-rule"
    >
      {/*
        Full-height portrait bleeding off the right edge. It is masked rather
        than cropped — a horizontal gradient dissolves it into the ground and a
        vertical one softens both ends, so there is no rectangle anywhere. The
        blend mode has to swap with the theme: multiply lets a light ground eat
        the highlights (ink behaviour), while screen lets a dark ground eat the
        shadows. Using one for both leaves a grey slab on the other.
      */}
      <div
        className="portrait-bleed absolute right-0 top-0 h-full w-full md:w-3/5 lg:w-1/2 pointer-events-none select-none"
        aria-hidden="true"
      >
        <img
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-[center_20%] grayscale contrast-125"
          src={CONTACT_PORTRAIT}
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <span className="label text-ink-faint">(04)</span>
          <span className="h-px flex-1 bg-rule" />
          <span className="label text-spot">Commissions</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <Reveal
              as="h2"
              split="lines"
              className="font-display font-black text-display-md text-ink mb-8"
            >
              Let&apos;s architect the future
            </Reveal>

            <p className="font-body text-base md:text-lg text-ink-soft font-light leading-relaxed max-w-md text-pretty">
              Currently taking on select engagements for 2026 — design systems,
              rendering work, and front-end architecture reviews.
            </p>

            <a
              href={`mailto:${EMAIL}`}
              className="inline-block mt-10 font-display font-semibold text-[clamp(1.25rem,2.5vw,2rem)] text-ink hover:text-spot transition-colors duration-500 link-underline break-all"
              data-cursor="active"
            >
              {EMAIL}
            </a>

            {/* Caption for the bleed portrait behind. The thumbnail that used
                to sit here is gone — the figure is now the full-height plate. */}
            <div className="mt-12 pt-6 border-t border-rule max-w-xs">
              <p className="font-display font-semibold text-lg text-ink leading-tight">
                Iman Mohammadi
              </p>
              <p className="label text-ink-faint mt-1.5">Architect — Tehran</p>
              <p className="label text-spot mt-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-spot rounded-full" aria-hidden="true" />
                Replies within 24h
              </p>
            </div>
          </div>

          <div>
            {status === 'sent' ? (
              <div
                role="status"
                className="p-8 bg-paper-dim border border-spot space-y-4 max-w-md backdrop-blur-md"
              >
                <div className="flex items-center gap-3 text-spot">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  <span className="text-sm uppercase tracking-widest font-bold">
                    Message received
                  </span>
                </div>
                <p className="font-body text-sm text-ink-soft leading-relaxed font-light">
                  Thank you — I reply within 24 hours.
                </p>
                <div className="pt-4 border-t border-rule flex items-center justify-between text-xs">
                  <span className="text-ink-faint">Ref. IM-2026</span>
                  <button
                    onClick={() => {
                      setFormData({ name: '', email: '', parameters: '' });
                      setStatus('idle');
                    }}
                    className="text-spot uppercase tracking-wider link-underline"
                    data-cursor="active"
                  >
                    Send another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7 max-w-md" noValidate>
                {FIELDS.map((field) => (
                  <div key={field.name}>
                    {/* Placeholders are not labels — screen readers need a real one. */}
                    <label htmlFor={`contact-${field.name}`} className="sr-only">
                      {field.label}
                    </label>
                    <input
                      id={`contact-${field.name}`}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      value={formData[field.name]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.name]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className="field-input"
                      required
                    />
                  </div>
                ))}

                <div role="alert" className="min-h-5">
                  {status === 'error' && (
                    <p className="flex items-center gap-2 text-ember text-xs">
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      Please complete all fields.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={status === 'transmitting'}
                    className="btn-swap bg-ink text-paper px-9 py-4 label disabled:opacity-50"
                    data-cursor="active"
                  >
                    {status === 'transmitting' ? (
                      <span className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Sending…
                      </span>
                    ) : (
                      <>
                        <span className="btn-swap-inner flex items-center gap-2">
                          Transmit <Send className="w-3.5 h-3.5" />
                        </span>
                        <span className="btn-swap-clone bg-spot gap-2" aria-hidden="true">
                          Transmit <Send className="w-3.5 h-3.5" />
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] uppercase tracking-wider text-ink-faint hover:text-ink px-5 py-4 border border-rule hover:border-rule transition-colors duration-500 flex items-center justify-center gap-2"
                    data-cursor="active"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-spot" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
