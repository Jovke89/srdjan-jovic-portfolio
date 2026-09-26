/* Site-wide interactions. Ported 1:1 from the Webflow custom-code embeds,
   moved to npm GSAP + Lenis. All motion is gated behind
   prefers-reduced-motion via gsap.matchMedia(). */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initHeroCanvas } from './hero-canvas';
import { initStagerButtons } from './stager';

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);

/* --- Copyright year (matches the Webflow inline script) --- */
function initCopyrightYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* --- Custom cursor --- */
function initCustomCursor() {
  const cursor = document.querySelector('.cursor');
  if (!cursor) return () => {};
  gsap.set('.cursor', { xPercent: -50, yPercent: -50 });
  const xTo = gsap.quickTo('.cursor', 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo('.cursor', 'y', { duration: 0.6, ease: 'power3' });
  const onMove = (e: MouseEvent) => {
    xTo(e.clientX);
    yTo(e.clientY);
  };
  window.addEventListener('mousemove', onMove);
  return () => window.removeEventListener('mousemove', onMove);
}

/* --- Blink nav link on hover --- */
function initBlinkNav() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll<HTMLElement>('.blink-btn').forEach((link) => {
    link.addEventListener('mouseenter', () => {
      const text = link.querySelector<HTMLElement>('.button_text-blink');
      if (text) text.style.animation = 'blink 0.15s step-start infinite';
    });
    link.addEventListener('mouseleave', () => {
      const text = link.querySelector<HTMLElement>('.button_text-blink');
      if (text) text.style.animation = '';
    });
  });
}

/* --- GSAP marquee (scroll direction) --- */
function initMarquee() {
  document
    .querySelectorAll<HTMLElement>('[data-marquee-scroll-direction-target]')
    .forEach((marquee) => {
      const marqueeContent = marquee.querySelector<HTMLElement>('[data-marquee-collection-target]');
      const marqueeScroll = marquee.querySelector<HTMLElement>('[data-marquee-scroll-target]');
      if (!marqueeContent || !marqueeScroll) return;
      const {
        marqueeSpeed: speed,
        marqueeDirection: direction,
        marqueeDuplicate: duplicate,
        marqueeScrollSpeed: scrollSpeed,
      } = marquee.dataset;
      const marqueeSpeedAttr = parseFloat(speed ?? '0');
      const marqueeDirectionAttr = direction === 'right' ? 1 : -1;
      const duplicateAmount = parseInt(duplicate || '0');
      const scrollSpeedAttr = parseFloat(scrollSpeed ?? '0');
      const speedMultiplier =
        window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
      const marqueeSpeedFinal =
        marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;
      marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
      marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`;
      if (duplicateAmount > 0) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < duplicateAmount; i++) {
          fragment.appendChild(marqueeContent.cloneNode(true));
        }
        marqueeScroll.appendChild(fragment);
      }
      const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
      const animation = gsap
        .to(marqueeItems, { xPercent: -100, repeat: -1, duration: marqueeSpeedFinal, ease: 'linear' })
        .totalProgress(0.5);
      gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
      animation.timeScale(marqueeDirectionAttr);
      animation.play();
      marquee.setAttribute('data-marquee-status', 'normal');
      ScrollTrigger.create({
        trigger: marquee,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const isInverted = self.direction === 1;
          const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;
          animation.timeScale(currentDirection);
          marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
        },
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: marquee, start: '0% 100%', end: '100% 0%', scrub: 0 },
      });
      const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
      const scrollEnd = -scrollStart;
      tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
    });
}

/* --- Text highlight on scroll (was split-type, now GSAP SplitText) --- */
function initSplitHighlight() {
  document.querySelectorAll<HTMLElement>('.big_text-animation').forEach((el) => {
    /* SplitText's default `aria: 'auto'` adds an aria-label to the split
       element — but this target is a <p>, whose implicit "paragraph" role
       doesn't permit aria-label (Lighthouse: "prohibited ARIA attributes").
       `aria: 'none'` opts out of that, and a genuine visually-hidden
       duplicate carries the accessible name instead; the split original
       (now just decorative chars) is hidden from assistive tech. */
    const srCopy = document.createElement('span');
    srCopy.className = 'sr-only';
    srCopy.textContent = el.textContent ?? '';
    el.insertAdjacentElement('beforebegin', srCopy);
    el.setAttribute('aria-hidden', 'true');

    const split = SplitText.create(el, { type: 'chars,words', aria: 'none' });
    gsap.from(split.chars, {
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top -30%', scrub: 5 },
      opacity: 0.2,
      stagger: 0.8,
    });
  });
}

/* --- Case-study card stacking (desktop) --- */
function initCardStacking() {
  if (window.innerWidth <= 991) return;
  const cards = gsap.utils.toArray<HTMLElement>('.case_study-card');
  const wrapper = document.querySelector<HTMLElement>('.case_study-cards-collection');
  if (!cards.length || !wrapper) return;
  /* Cards size to their own content now, so measure the tallest one (while they
     are still in normal flow) instead of assuming a fixed height. */
  const cardHeight = Math.max(...cards.map((card) => card.offsetHeight), 420);
  /* Read once, before any card gets `position: fixed` below — reading
     offsetWidth again inside the loop would force a synchronous reflow on
     every iteration, since each prior card's style write invalidates layout. */
  const wrapperWidth = wrapper.offsetWidth;
  wrapper.style.height = cardHeight + 'px';
  wrapper.style.overflow = 'visible';
  cards.forEach((card, i) => {
    gsap.set(card, {
      zIndex: i + 1,
      position: 'fixed',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: wrapperWidth + 'px',
    });
    if (i !== 0) gsap.set(card, { y: window.innerHeight, opacity: 0 });
  });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.case_study-cards-collection',
      start: 'top 20%',
      end: `+=${cardHeight * cards.length * 1.1}`,
      scrub: 0.8,
      pin: true,
      pinSpacing: true,
    },
  });
  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      const nextCard = cards[i + 1];
      tl.set(nextCard, { opacity: 1 }, i * 0.5);
      tl.to(card, { scale: 0.9, y: -20, duration: 0.5, ease: 'none' }, i * 0.5);
      tl.to(nextCard, { y: 0, duration: 0.5, ease: 'none' }, i * 0.5);
    }
  });
}

/* --- Page loader (3 steps, desktop) --- */
function initLoaderThreeSteps() {
  if (!document.querySelector('.loading-container')) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.inOut', duration: 1.2 } });
  const n1 = gsap.utils.random([2, 3, 4]);
  const n2 = gsap.utils.random([5, 6]);
  const n3 = gsap.utils.random([1, 5]);
  const n4 = gsap.utils.random([7, 8, 9]);
  tl.set('.loading-container', { display: 'flex', yPercent: 0 });
  tl.set('.loading__progress-inner', { scaleY: 0 });
  tl.set('.loading__number-group.is--first .loading__number-wrap, .loading__percentage', { yPercent: 100 });
  tl.set(
    '.loading__number-group.is--second .loading__number-wrap, .loading__number-group.is--third .loading__number-wrap',
    { yPercent: 10 },
  );
  tl.to('.loading__progress-inner', { scaleY: Number(`${n1}${n3}`) / 100 });
  tl.to('.loading__percentage', { yPercent: 0 }, '<');
  tl.to('.loading__number-group.is--second .loading__number-wrap', { yPercent: (n1 - 1) * -10 }, '<');
  tl.to('.loading__number-group.is--third .loading__number-wrap', { yPercent: (n3 - 1) * -10 }, '<');
  tl.to('.loading__progress-inner', { scaleY: Number(`${n2}${n4}`) / 100 });
  tl.to('.loading__number-group.is--second .loading__number-wrap', { yPercent: (n2 - 1) * -10 }, '<');
  tl.to('.loading__number-group.is--third .loading__number-wrap', { yPercent: (n4 - 1) * -10 }, '<');
  tl.to('.loading__progress-inner', { scaleY: 1 });
  tl.to('.loading__number-group.is--second .loading__number-wrap', { yPercent: -90 }, '<');
  tl.to('.loading__number-group.is--third .loading__number-wrap', { yPercent: -90 }, '<');
  tl.to('.loading__number-group.is--first .loading__number-wrap', { yPercent: 0 }, '<');
  tl.to('.loading-container', { yPercent: -100, duration: 1.15, ease: 'power4.inOut', delay: 0.3 });
  tl.set('.loading-container', { display: 'none', clearProps: 'transform' });
  return tl;
}

/* --- Loader on first visit only: returning visitors skip the intro. Storage can
   be blocked (private mode, strict settings); then the loader simply shows. --- */
const LOADER_SEEN_KEY = 'sj-loader-seen';
function shouldShowLoader(): boolean {
  if (!document.querySelector('.loading-container')) return false;
  try {
    if (localStorage.getItem(LOADER_SEEN_KEY)) return false;
    localStorage.setItem(LOADER_SEEN_KEY, '1');
  } catch {
    // Storage unavailable: keep the default behaviour and show the loader.
  }
  return true;
}

/* --- Hero heading stagger (desktop), delayed to start as the loader clears --- */
function initHeroHeadingStagger(delay = 4.5) {
  if (!document.querySelector('.hero_home-heading')) return;
  document.fonts.ready.then(() => {
    SplitText.create('.hero_home-heading', {
      type: 'words',
      mask: 'words',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          yPercent: 120,
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          delay,
        });
      },
    });
  });
}

/* --- Hero content overlap / pin (desktop). Per-page settings ported 1:1 from
   the Webflow "HERO SECTION OVERLAP" embeds. Only the inner content wrapper is
   pinned/scaled, never the whole section. The taxonomy hero reuses
   `.section_hero-projects` but keeps its list inside the wrapper, so its class
   is deliberately not in this list. --- */
function initHeroOverlap() {
  const configs = [
    { sel: '.section_hero-content-wrapper', start: 'top top', end: '+=80%' }, // home
    { sel: '.projects_hero-heading-wrapper', start: 'top 100px', end: '+=100%' }, // case studies list
    { sel: '.events_hero-content-wrapper', start: 'top 100px', end: '+=100%' }, // events list
    { sel: '.resources_hero-content-wrapper', start: 'top top', end: '+=80%' }, // resources list
    { sel: '.hero_animation-target', start: '25%', end: '+=80%' }, // case study detail
  ];
  configs.forEach(({ sel, start, end }) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return;
    gsap
      .timeline({
        scrollTrigger: { trigger: el, start, end, scrub: 1, pin: true, pinSpacing: false, anticipatePin: 1 },
      })
      .to(el, { scale: 0.7, opacity: 0, ease: 'none' });
  });
}

/* --- Result counters: numbers in `.result_value` count up from 0 when scrolled
   into view. Ported from the Webflow case-study embed; skipped under
   reduced-motion (the stored value just stays put). --- */
function initResultCounters() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.utils.toArray<HTMLElement>('.result_value').forEach((el) => {
    const originalText = (el.textContent ?? '').trim();
    const match = originalText.match(/[\d.,]+/);
    if (!match) return;
    const target = Number(match[0].replace(',', '.'));
    const start = match.index ?? 0;
    const prefix = originalText.slice(0, start);
    const suffix = originalText.slice(start + match[0].length);
    const counter = { value: 0 };
    el.textContent = `${prefix}0${suffix}`;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.to(counter, {
          value: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = `${prefix}${Math.round(counter.value)}${suffix}`;
          },
        });
      },
    });
  });
}

/* --- Video testimonials (lazy-load + click to play), ported from the
   Webflow per-item embed script --- */
function initVideoTestimonials() {
  document.querySelectorAll<HTMLElement>('.video-wrap').forEach((wrap) => {
    if (wrap.dataset.vidInit === 'true') return;
    wrap.dataset.vidInit = 'true';
    const video = wrap.querySelector<HTMLVideoElement>('.video-el');
    const spinner = wrap.querySelector<HTMLElement>('.vid-spinner');
    const btn = wrap.querySelector<HTMLElement>('.vid-btn');
    const icon = wrap.querySelector<SVGElement>('.vid-icon');
    const src = wrap.dataset.src;
    if (!video || !spinner || !btn || !icon || !src) {
      wrap.style.display = 'none';
      return;
    }
    const ensureLoaded = () => {
      if (!video.src) video.src = src;
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              ensureLoaded();
              observer.unobserve(video);
            }
          });
        },
        { rootMargin: '200px' },
      );
      observer.observe(video);
    } else {
      ensureLoaded();
    }
    const toggleVideo = () => {
      ensureLoaded();
      if (video.paused) {
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            icon.innerHTML = '<polygon points="6,4 20,12 6,20"/>';
          });
        }
        icon.innerHTML =
          '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      } else {
        video.pause();
        icon.innerHTML = '<polygon points="6,4 20,12 6,20"/>';
        btn.style.opacity = '1';
      }
    };
    wrap.addEventListener('click', toggleVideo);
    wrap.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
    });
    wrap.addEventListener('mouseleave', () => {
      if (!video.paused) btn.style.opacity = '0';
    });
    video.addEventListener('waiting', () => {
      spinner.style.display = 'flex';
    });
    video.addEventListener('playing', () => {
      spinner.style.display = 'none';
    });
    video.addEventListener('error', () => {
      spinner.style.display = 'none';
      wrap.style.cursor = 'default';
      wrap.removeEventListener('click', toggleVideo);
    });
  });
}

/* --- Services: hover-reveal image that drifts toward the cursor (desktop).
   Rebuilt from the Webflow Interaction; the pointer is over the row, not the
   image, and the image parallaxes with the pointer's direction of travel. --- */
function initServicesHover() {
  const items = gsap.utils.toArray<HTMLElement>('.services_option-item');
  if (!items.length) return () => {};
  const cleanups: Array<() => void> = [];
  items.forEach((item) => {
    const wrap = item.querySelector<HTMLElement>('.option_item-img-wrapper');
    if (!wrap) return;
    const xTo = gsap.quickTo(wrap, 'x', { duration: 0.9, ease: 'power3' });
    const yTo = gsap.quickTo(wrap, 'y', { duration: 0.9, ease: 'power3' });
    const rTo = gsap.quickTo(wrap, 'rotation', { duration: 0.9, ease: 'power3' });
    const onEnter = () => item.classList.add('is-hovering');
    const onMove = (e: MouseEvent) => {
      const r = item.getBoundingClientRect();
      const relX = (e.clientX - r.left) / r.width - 0.5;
      const relY = (e.clientY - r.top) / r.height - 0.5;
      xTo(relX * 64);
      yTo(relY * 40);
      rTo(relX * 6);
    };
    const onLeave = () => {
      item.classList.remove('is-hovering');
      xTo(0);
      yTo(0);
      rTo(0);
    };
    item.addEventListener('mouseenter', onEnter);
    item.addEventListener('mousemove', onMove);
    item.addEventListener('mouseleave', onLeave);
    cleanups.push(() => {
      item.removeEventListener('mouseenter', onEnter);
      item.removeEventListener('mousemove', onMove);
      item.removeEventListener('mouseleave', onLeave);
      gsap.set(wrap, { clearProps: 'transform' });
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

/* --- Magnetic round buttons (Webflow "mouse move over element" model). The
   cursor's offset from the wrapper centre maps linearly to a *bounded* button
   travel: at `catch` px away the button has moved exactly `travel` px, and it
   springs back once the cursor leaves that radius. The cap keeps the motion
   tight instead of letting the button drift far from its slot. The wrapper
   centre is the anchor because the wrapper is never transformed. --- */
function initMagneticButton() {
  const configs = [
    { wrap: '.footer_btn-wrapper', btn: '.footer_btn', catch: 330, travel: 130, duration: 0.45 },
    { wrap: '.view_site-btn-wrapper', btn: '.view_site-btn', catch: 200, travel: 26, duration: 0.3 },
  ];
  const cleanups: Array<() => void> = [];
  configs.forEach(({ wrap: wrapSelector, btn: btnSelector, catch: catchR, travel, duration }) => {
    gsap.utils.toArray<HTMLElement>(wrapSelector).forEach((wrap) => {
      const btn = wrap.querySelector<HTMLElement>(btnSelector);
      if (!btn) return;
      const xTo = gsap.quickTo(btn, 'x', { duration, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration, ease: 'power3' });
      const factor = travel / catchR;
      const onMove = (e: MouseEvent) => {
        const r = wrap.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (dx * dx + dy * dy < catchR * catchR) {
          xTo(dx * factor);
          yTo(dy * factor);
        } else {
          xTo(0);
          yTo(0);
        }
      };
      window.addEventListener('mousemove', onMove);
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMove);
        gsap.set(btn, { clearProps: 'transform' });
      });
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

/* --- Deferred init START ---
   Non-critical setup runs one function per task instead of all at once, so no
   single long task blocks the main thread during load (Lighthouse TBT). Each
   step runs inside its gsap.matchMedia context so breakpoint and reduced-motion
   changes still revert everything it created. */
const nextTask = () =>
  new Promise<void>((resolve) => {
    const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) scheduler.yield().then(resolve);
    else setTimeout(resolve, 0);
  });

let refreshQueued = false;
/* One ScrollTrigger measurement pass after the deferred steps, instead of one per block.
   Lenis (desktop only) is read from window so either block can queue the pass. */
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  setTimeout(() => {
    refreshQueued = false;
    (window as unknown as { lenis?: Lenis }).lenis?.resize();
    ScrollTrigger.refresh();
  }, 100);
}

/* Runs `fn` once, after the visitor's first interaction, as soon as the first
   element matching `selector` is within roughly one viewport of the screen.
   Below-the-fold effects are ready before they are seen, and cost nothing
   during page load (reaching them always requires a scroll first). */
function whenNear(selector: string, fn: () => void, isActive: () => boolean): () => void {
  const target = document.querySelector(selector);
  if (!target) return () => {};
  let stopObserving = () => {};
  const stopWaiting = onFirstInteraction(() => {
    stopObserving = observeNear(target, fn, isActive);
  }, isActive);
  return () => {
    stopWaiting();
    stopObserving();
  };
}

/* Checks the target's position on scroll (and once right away) until it is
   within one viewport of the screen, then runs `fn` and stops listening. */
function observeNear(target: Element, fn: () => void, isActive: () => boolean): () => void {
  const stop = () => window.removeEventListener('scroll', check);
  function check() {
    if (target.getBoundingClientRect().top > window.innerHeight * 2) return;
    stop();
    if (isActive()) fn();
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
  return stop;
}

/* Runs `fn` once, on the visitor's first scroll, wheel, pointer move, touch or key press. */
const INTERACTION_EVENTS = ['scroll', 'wheel', 'pointermove', 'touchstart', 'keydown'] as const;
function onFirstInteraction(fn: () => void, isActive: () => boolean): () => void {
  const run = () => {
    stop();
    if (isActive()) fn();
  };
  const stop = () => INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, run));
  INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, run, { passive: true }));
  return stop;
}

function runDeferred(context: gsap.Context, steps: Array<() => void>, isActive: () => boolean, onDone: () => void) {
  void (async () => {
    for (const step of steps) {
      await nextTask();
      if (!isActive()) return;
      context.add(step);
    }
    onDone();
  })();
}
/* Deferred init END */

/* --- boot --- */
function boot() {
  initCopyrightYear();
  initStagerButtons();
  initBlinkNav();
  initVideoTestimonials();
  initResultCounters();

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', (context) => {
    let active = true;
    let cleanCanvas = () => {};
    const cleanCursor = initCustomCursor();

    // The background canvas is decorative: start it once the page has loaded.
    const startCanvas = () => {
      if (active) cleanCanvas = initHeroCanvas();
    };
    if (document.readyState === 'complete') startCanvas();
    else window.addEventListener('load', startCanvas, { once: true });

    const isActive = () => active;
    // Marquee sits right under the hero, so it gets a deferred step; the text
    // highlight is further down and waits until the visitor scrolls near it.
    runDeferred(context, [initMarquee], isActive, queueRefresh);
    const stopHighlight = whenNear('.big_text-animation', () => (context.add(initSplitHighlight), queueRefresh()), isActive);

    return () => {
      active = false;
      stopHighlight();
      window.removeEventListener('load', startCanvas);
      cleanCanvas();
      cleanCursor();
    };
  });

  // Desktop/tablet only (matches Nav.astro's 991px collapse breakpoint) — on
  // mobile, Lenis kept fighting the hamburger menu's own scroll lock (native
  // touch scroll is fine without it there anyway).
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 992px)', (context) => {
    let active = true;
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      anchors: true,
      allowNestedScroll: true,
      autoRaf: false,
    });
    (window as unknown as { lenis: Lenis }).lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const rafCb = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    // Above the fold: the intro loader (first visit only) and hero heading start immediately.
    // Without the loader, the heading animates in right away instead of waiting for it.
    const showLoader = shouldShowLoader();
    if (showLoader) initLoaderThreeSteps();
    initHeroHeadingStagger(showLoader ? 4.5 : 0.2);

    // Everything else is prepared only when needed, so none of it runs during page load:
    // scroll and hover effects on the first interaction, the card stack when it is near.
    const isActive = () => active;
    let cleanServices = () => {};
    let cleanMagnetic = () => {};
    const stopInteraction = onFirstInteraction(
      () =>
        runDeferred(
          context,
          [initHeroOverlap, () => (cleanServices = initServicesHover()), () => (cleanMagnetic = initMagneticButton())],
          isActive,
          queueRefresh,
        ),
      isActive,
    );
    const stopCards = whenNear('.case_study-cards-collection', () => (context.add(initCardStacking), queueRefresh()), isActive);

    return () => {
      active = false;
      stopInteraction();
      stopCards();
      cleanServices();
      cleanMagnetic();
      gsap.ticker.remove(rafCb);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
