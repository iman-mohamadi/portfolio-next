/**
 * Portrait sources.
 *
 * Served from `public/` rather than hotlinked. The originals were ephemeral
 * AI Studio `googleusercontent` URLs, which rate-limit under repeated loads
 * (observed 429s) and would eventually expire — a hero that depends on a
 * third-party CDN staying up is a hero that breaks. Local files are also
 * same-origin, so the WebGL TextureLoader needs no CORS negotiation.
 *
 * Both are 343x512. That is small for a full-bleed plate; replacing them with
 * a ~1500px export is the single biggest quality win available here.
 */

export const HERO_PORTRAIT = '/portrait-hero.jpeg';
export const CONTACT_PORTRAIT = '/portrait-contact.png';
