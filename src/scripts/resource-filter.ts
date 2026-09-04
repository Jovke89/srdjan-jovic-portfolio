/* Replaces Finsweet on /resources: category filter (URL-synced) + client-side
   pagination. Works with JS off (all cards visible, links crawlable). */
const list = document.querySelector<HTMLElement>('.resources-articles_list');
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter_btn'));
const pager = document.querySelector<HTMLElement>('[data-pager]');
const prevBtn = document.querySelector<HTMLButtonElement>('[data-page-prev]');
const nextBtn = document.querySelector<HTMLButtonElement>('[data-page-next]');
const pageCountEl = document.querySelector<HTMLElement>('[data-page-count]');
const visibleCountEl = document.querySelector<HTMLElement>('[data-count="visible"]');
const loadedCountEl = document.querySelector<HTMLElement>('[data-count="loaded"]');
const totalCountEl = document.querySelector<HTMLElement>('[data-count="total"]');

if (list) {
  const items = Array.from(list.children) as HTMLElement[];
  const pageSize = Number(list.dataset.pageSize || '12');
  let currentFilter = new URLSearchParams(location.search).get('category') || '';
  let currentPage = Math.max(1, Number(new URLSearchParams(location.search).get('page') || '1'));

  function matches(el: HTMLElement) {
    return !currentFilter || (el.dataset.category || '') === currentFilter;
  }

  function render() {
    const filtered = items.filter(matches);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    items.forEach((el) => (el.hidden = true));
    const shown = filtered.slice(start, end);
    shown.forEach((el) => (el.hidden = false));

    if (visibleCountEl) visibleCountEl.textContent = String(shown.length);
    // "loaded so far" = everything paged through up to and including this page.
    if (loadedCountEl) loadedCountEl.textContent = String(Math.min(end, filtered.length));
    if (totalCountEl) totalCountEl.textContent = String(items.length);
    if (pager) pager.hidden = pages <= 1;
    if (pageCountEl) pageCountEl.textContent = `Page ${currentPage} of ${pages}`;
    // Hide (not just disable) the arrows when there is nowhere to go.
    // `is-list-pagination-disabled` is the Webflow class already styled display:none.
    const noPrev = currentPage <= 1;
    const noNext = currentPage >= pages;
    if (prevBtn) {
      prevBtn.classList.toggle('is-list-pagination-disabled', noPrev);
      prevBtn.disabled = noPrev;
    }
    if (nextBtn) {
      nextBtn.classList.toggle('is-list-pagination-disabled', noNext);
      nextBtn.disabled = noNext;
    }

    buttons.forEach((b) => {
      const active = (b.dataset.filter || '') === currentFilter;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    const params = new URLSearchParams();
    if (currentFilter) params.set('category', currentFilter);
    if (currentPage > 1) params.set('page', String(currentPage));
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  /* Only pagination jumps back to the top of the list (so you don't land at the
     bottom of the new page). Lenis, when present, honours the nav offset;
     otherwise `scroll-margin-top` on #all-articles keeps the heading clear of
     the sticky nav. Changing a filter never scrolls — you are already there. */
  function scrollToListTop() {
    const target = document.getElementById('all-articles');
    if (!target) return;
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: Element, o?: object) => void } }).lenis;
    if (lenis) lenis.scrollTo(target, { offset: -96 });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      currentFilter = b.dataset.filter || '';
      currentPage = 1;
      render();
    }),
  );
  prevBtn?.addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1);
    render();
    scrollToListTop();
  });
  nextBtn?.addEventListener('click', () => {
    currentPage += 1;
    render();
    scrollToListTop();
  });

  render();
}
