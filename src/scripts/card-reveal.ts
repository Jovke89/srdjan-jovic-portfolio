/* Card reveal START */
/* Staggered fade-up for testimonial, resource and case study cards as they
   scroll into view. The motion itself is a CSS keyframe in app.css; this only
   marks which cards wait and when each one starts. Cards that enter the
   viewport together form one batch and start one after another.
   Called from site.ts inside the desktop-only gsap.matchMedia context, so phones,
   touch devices and reduced motion never hide anything. Home case study cards
   (.case_study-card) are left out on purpose: the card stacking pin owns them. */
const CARD_SELECTOR = [
  '.video_testimonial-item',
  '.projects_item-wrapper',
  '.resources-articles_item-wrapper',
  '.resource_grid-item',
].join(',');

const STAGGER_MS = 150;
const MAX_STAGGER_STEPS = 5;

export function initCardReveal() {
  const cards = [...document.querySelectorAll<HTMLElement>(CARD_SELECTOR)];
  if (!cards.length || !('IntersectionObserver' in window)) return () => {};

  // Cards already on screen stay as they are, so nothing visible blinks out
  // and back in. All rects are read in one pass before any class is written.
  const viewportHeight = window.innerHeight;
  const waiting = cards.filter((card) => card.getBoundingClientRect().top > viewportHeight);

  const observer = new IntersectionObserver(
    (entries) => {
      let step = 0;
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry) => {
          const card = entry.target as HTMLElement;
          card.style.setProperty('--card-reveal-delay', `${Math.min(step++, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
          card.classList.add('is-revealed');
          observer.unobserve(card);
        });
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  waiting.forEach((card) => {
    card.classList.add('card-reveal');
    observer.observe(card);
  });

  return () => {
    observer.disconnect();
    waiting.forEach((card) => {
      card.classList.remove('card-reveal', 'is-revealed');
      card.style.removeProperty('--card-reveal-delay');
    });
  };
}
/* Card reveal END */
