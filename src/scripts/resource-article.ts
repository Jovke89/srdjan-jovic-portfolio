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

// Copy-link share: same as the original Webflow embed (writeText + feedback),
// just swapping the alert() for the "Link copied!" tooltip (see app.css).
const copyBtn = document.querySelector<HTMLElement>('[data-share="copy"]');
copyBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  navigator.clipboard.writeText(location.href);
  copyBtn.classList.add('is-copied');
  setTimeout(() => copyBtn.classList.remove('is-copied'), 1500);
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
          // `.u-toc-current-link` is the Webflow class that actually carries the
          // yellow left border + 1.5rem left padding for the active TOC link.
          tocLinks.forEach((a) =>
            a.classList.toggle('u-toc-current-link', decodeURIComponent(a.hash.slice(1)) === id),
          );
        }
      });
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 },
  );
  headings.forEach((h) => observer.observe(h));
}
