/* Mailchimp embedded form, submitted without ever leaving/navigating the page.
   list-manage.com doesn't allow a normal cross-origin fetch, so this uses
   Mailchimp's own JSONP endpoint (/post-json + a <script> tag) — the same
   trick their official embed script uses. Replaces Webflow's own AJAX form
   handling (webflow.js), which this static rebuild no longer has. */
document.querySelectorAll<HTMLFormElement>('.newsletter_form-wrapper').forEach((form) => {
  const wrapper = form.closest<HTMLElement>('.newsletter_form-modal');
  const doneEl = wrapper?.querySelector<HTMLElement>('.w-form-done');
  const failEl = wrapper?.querySelector<HTMLElement>('.w-form-fail');
  // A real <button> (not <input type="submit">) so it can hold the
  // data-stager-text roll animation like every other button on the site.
  const submitBtn = form.querySelector<HTMLButtonElement>('[type="submit"]');

  function setBusy(busy: boolean) {
    if (submitBtn) submitBtn.disabled = busy;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (failEl) failEl.style.display = 'none';
    setBusy(true);

    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => params.append(key, String(value)));

    const jsonUrl = form.action.replace('/subscribe/post?', '/subscribe/post-json?');
    const callbackName = `mcJsonp${Date.now()}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
      setBusy(false);
    };

    (window as unknown as Record<string, (data: { result?: string }) => void>)[callbackName] = (
      data,
    ) => {
      cleanup();
      if (data?.result === 'success') {
        form.style.display = 'none';
        if (doneEl) doneEl.style.display = 'block';
      } else if (failEl) {
        failEl.style.display = 'block';
      }
    };

    script.onerror = () => {
      cleanup();
      if (failEl) failEl.style.display = 'block';
    };

    script.src = `${jsonUrl}&${params.toString()}&c=${callbackName}`;
    document.body.appendChild(script);
  });
});
