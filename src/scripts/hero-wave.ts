/* Hero wave START */
/* Desktop entrance for the page hero. Every page's H1 rises letter by letter
   (a wave); detail templates also bring in their label, description, info
   badges and cover, in that order. Everything listed here starts hidden via
   `html.has-hero-motion` in app.css (set in BaseLayout's head only on desktop
   with a mouse and motion allowed), so nothing flashes before this runs. */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface HeroExtras {
  section: string;
  label?: string;
  description?: string;
  items?: string;
  media?: string;
}

/* Keep the selectors in sync with the "Hero wave" block in app.css. */
const TEMPLATES: HeroExtras[] = [
  {
    section: '.section_hero-case-template',
    label: '.section_hero-case-content-wrapper > .text_in-exprecions',
    description: '.case_template-hero-heading p',
    items: '.section_hero-template-info-wrapper .info_wrapper',
    media: '.case_template-hero-img-wrapper',
  },
  {
    section: '.section_resources-template-hero',
    label: '.bak_to-all-posts',
    items: '.resource_template-info > *',
    media: '.resource_template-img-mask',
  },
];

/* Long titles would otherwise take seconds to finish: spread at most this much
   time across all letters, never more than 0.05s per letter. */
const MAX_TITLE_STAGGER = 0.9;

export function initHeroWave(delay = 0.2) {
  const title = document.querySelector<HTMLElement>('h1');
  const extras = TEMPLATES.find((t) => document.querySelector(t.section));
  const scope = extras ? document.querySelector<HTMLElement>(extras.section)! : document;
  const pick = (sel?: string) => (sel ? [...scope.querySelectorAll<HTMLElement>(sel)] : []);
  const label = pick(extras?.label);
  const description = pick(extras?.description)[0];
  const items = pick(extras?.items);
  const media = pick(extras?.media);
  if (!title && !extras) return;

  document.fonts.ready.then(() => {
    const titleSplit = title ? SplitText.create(title, { type: 'words,chars', mask: 'words' }) : null;
    const descriptionSplit = description ? SplitText.create(description, { type: 'lines', mask: 'lines' }) : null;
    const rise = { yPercent: 120, ease: 'power4.out' };
    const tl = gsap.timeline({ delay });
    gsap.set([title, description, ...label, ...items, ...media].filter(Boolean), { autoAlpha: 1 });

    if (label.length) tl.from(label, { ...rise, opacity: 0, duration: 0.8 }, 0);
    if (titleSplit) {
      const each = Math.min(0.05, MAX_TITLE_STAGGER / titleSplit.chars.length);
      tl.from(titleSplit.chars, { ...rise, duration: 1, stagger: each }, 0.1);
    }
    if (descriptionSplit) tl.from(descriptionSplit.lines, { ...rise, duration: 0.9, stagger: 0.08 }, 0.35);
    if (items.length) tl.from(items, { y: 24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 0.6);
    if (media.length) tl.from(media, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.3);
  });
}
/* Hero wave END */
