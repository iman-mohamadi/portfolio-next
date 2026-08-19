import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);

/**
 * Signature easing curves. A consistent motion vocabulary is what separates a
 * site that "has animations" from one that feels authored — every transition on
 * this site resolves with one of these four.
 */
CustomEase.create('arch', '0.16, 1, 0.3, 1'); // primary: heavy expo settle
CustomEase.create('archIn', '0.7, 0, 0.84, 0'); // exits
CustomEase.create('archInOut', '0.87, 0, 0.13, 1'); // curtains, page-level moves
CustomEase.create('lift', '0.22, 1, 0.36, 1'); // small UI, hovers

gsap.defaults({ ease: 'arch', duration: 1 });

// Never let a slow frame silently rescale our timelines.
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
