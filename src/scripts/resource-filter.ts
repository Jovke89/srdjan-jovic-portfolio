/* Replaces Finsweet on /resources: category filter (URL-synced) + client-side
   pagination. Works with JS off (all cards visible, links crawlable). */
const list = document.querySelector<HTMLElement>('.resources-articles_list');
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter_btn'));
const pager = document.querySelector<HTMLElement>('[data-pager]');
const prevBtn = document.querySelector<HTMLButtonElement>('[data-page-prev]');
const nextBtn = document.querySelector<HTMLButtonElement>('[data-page-next]');
const pageCountEl = document.querySelector<HTMLElement>('[data-page-count]');
const visibleCountEl = document.querySelector<HTMLElement>('[data-count="visible"]');

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
    if (pager) pager.hidden = pages <= 1;
    if (pageCountEl) pageCountEl.textContent = `Page ${currentPage} of ${pages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= pages;

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

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      currentFilter = b.dataset.filter || '';
      currentPage = 1;
      render();
      document.getElementById('all-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );
  prevBtn?.addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1);
    render();
    document.getElementById('all-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  nextBtn?.addEventListener('click', () => {
    currentPage += 1;
    render();
    document.getElementById('all-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  render();
}
