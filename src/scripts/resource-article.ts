/* Resource article: FAQ accordion, TOC scrollspy, copy-link share.
   Replaces the Webflow w-dropdown FAQ + fc-toc. */

// FAQ accordion
document.querySelectorAll<HTMLElement>('.faq_block').forEach((block) => {
  const toggle = block.querySelector<HTMLButtonElement>('.faq_toggle');
  toggle?.addEventListener('click', () => {
    const open = block.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
});

// Copy-link share
document.querySelector<HTMLElement>('[data-share="copy"]')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    const el = document.querySelector<HTMLElement>('[data-share="copy"]');
    el?.classList.add('is-copied');
    setTimeout(() => el?.classList.remove('is-copied'), 1500);
  } catch {
    /* ignore */
  }
});

// TOC scrollspy
const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.blog-post_toc-list a'));
if (tocLinks.length) {
  const headings = tocLinks
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter((el): el is HTMLElement => Boolean(el));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach((a) =>
            a.classList.toggle('is-active', decodeURIComponent(a.hash.slice(1)) === id),
          );
        }
      });
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 },
  );
  headings.forEach((h) => observer.observe(h));
}
