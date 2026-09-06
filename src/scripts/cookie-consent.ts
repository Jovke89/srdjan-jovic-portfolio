/* GDPR-style cookie consent banner. Shown once until the visitor makes a
   choice; the decision is remembered in localStorage so it doesn't reappear
   on later visits. Accepting (either "Accept All" or "Save Preferences" with
   the Analytics switch on) fires a `cookieconsent:accepted` event that
   Analytics.astro listens for to start loading Google Analytics — declining
   (or leaving the banner unanswered) keeps GA4 off entirely. */
const STORAGE_KEY = 'cookie-consent';

const banner = document.querySelector<HTMLElement>('#cookie-consent');

if (banner) {
  const mainPanel = banner.querySelector<HTMLElement>('[data-cookie-panel="main"]');
  const customisePanel = banner.querySelector<HTMLElement>('[data-cookie-panel="customise"]');
  const analyticsToggle = banner.querySelector<HTMLInputElement>('#cookie-consent-analytics-toggle');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let consent: string | null = null;
  try {
    consent = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private browsing, locked-down settings) — treat as
    // "no decision yet" rather than crashing.
  }

  function showPanel(name: 'main' | 'customise') {
    if (mainPanel) mainPanel.hidden = name !== 'main';
    if (customisePanel) customisePanel.hidden = name !== 'customise';
  }

  function open() {
    banner!.hidden = false;
    // Force a layout flush so the initial translateY(100%) state actually
    // paints before adding .is-open — otherwise the browser can collapse
    // both changes into one frame and skip the slide-up transition.
    void banner!.offsetHeight;
    requestAnimationFrame(() => banner!.classList.add('is-open'));
  }

  function close() {
    banner!.classList.remove('is-open');
    if (prefersReducedMotion) {
      banner!.hidden = true;
      return;
    }
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== banner || e.propertyName !== 'transform') return;
      banner!.removeEventListener('transitionend', onTransitionEnd);
      banner!.hidden = true;
    };
    banner!.addEventListener('transitionend', onTransitionEnd);
    // Safety net in case transitionend never fires (e.g. display change
    // interrupts it) so the banner doesn't stay in the layout forever.
    setTimeout(() => {
      banner!.removeEventListener('transitionend', onTransitionEnd);
      banner!.hidden = true;
    }, 600);
  }

  function setConsent(value: 'accepted' | 'declined') {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore — the banner still closes for this page view even if the
      // choice can't be persisted for next time.
    }
    close();
    if (value === 'accepted') {
      window.dispatchEvent(new CustomEvent('cookieconsent:accepted'));
    }
  }

  banner.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-cookie-action]')?.dataset.cookieAction;
    if (!action) return;

    switch (action) {
      case 'accept':
        setConsent('accepted');
        break;
      case 'reject':
        setConsent('declined');
        break;
      case 'customise':
        if (analyticsToggle) analyticsToggle.checked = false;
        showPanel('customise');
        break;
      case 'back':
        showPanel('main');
        break;
      case 'save':
        setConsent(analyticsToggle?.checked ? 'accepted' : 'declined');
        break;
    }
  });

  // Matches the hero heading's 4.5s delay (site.ts, initHeroHeadingStagger)
  // so the banner doesn't pop in over the intro loader/heading animation.
  if (!consent) setTimeout(open, 4500);
}
