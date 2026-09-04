/* Site-wide interactions. Ported 1:1 from the Webflow custom-code embeds,
   moved to npm GSAP + Lenis. All motion is gated behind
   prefers-reduced-motion via gsap.matchMedia(). */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initHeroCanvas } from './hero-canvas';

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

/* --- Stager button (letter roll on [data-stager-text]) --- */
function initStagerButtons() {
  document.querySelectorAll<HTMLElement>('[data-stager-text]').forEach((el) => {
    if (el.dataset.stagerInit) return;
    el.dataset.stagerInit = '1';
    const original = el.textContent ?? '';
    el.innerHTML = '';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.display = 'inline-block';
    const rowIn = document.createElement('span');
    rowIn.style.cssText = 'display:flex;';
    const rowOut = document.createElement('span');
    rowOut.style.cssText =
      'display:flex; position:absolute; top:50%; left:0; right:0; justify-content:center; transform:translateY(-50%);';
    original.split('').forEach((char, i) => {
      const delay = i * 25 + 'ms';
      const s1 = document.createElement('span');
      s1.textContent = char === ' ' ? ' ' : char;
      s1.style.cssText = `display:inline-block; transition:transform 0.5s ${delay}, opacity 0.4s ${delay}; transition-timing-function:cubic-bezier(0.76,0,0.24,1);`;
      rowIn.appendChild(s1);
      const s2 = document.createElement('span');
      s2.textContent = char === ' ' ? ' ' : char;
      s2.style.cssText = `display:inline-block; transform:translateY(120%); opacity:0; transition:transform 0.5s ${delay}, opacity 0.4s ${delay}; transition-timing-function:cubic-bezier(0.76,0,0.24,1);`;
      rowOut.appendChild(s2);
    });
    el.appendChild(rowIn);
    el.appendChild(rowOut);
    const btn = el.closest<HTMLElement>('[data-stager-btn]');
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      rowIn.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(-120%)';
        (s as HTMLElement).style.opacity = '0';
      });
      rowOut.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(0)';
        (s as HTMLElement).style.opacity = '1';
      });
    });
    btn.addEventListener('mouseleave', () => {
      rowIn.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = '';
        (s as HTMLElement).style.opacity = '';
      });
      rowOut.querySelectorAll('span').forEach((s) => {
        (s as HTMLElement).style.transform = 'translateY(120%)';
        (s as HTMLElement).style.opacity = '0';
      });
    });
  });
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
    const split = SplitText.create(el, { type: 'chars,words' });
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
      width: wrapper.offsetWidth + 'px',
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

/* --- boot --- */
function boot() {
  initCopyrightYear();
  initStagerButtons();
  initBlinkNav();
  initVideoTestimonials();
  initResultCounters();

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanCanvas = initHeroCanvas();
    const cleanCursor = initCustomCursor();

    initMarquee();
    initSplitHighlight();

    setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      cleanCanvas();
      cleanCursor();
    };
  });

  // Desktop/tablet only (matches Nav.astro's 991px collapse breakpoint) — on
  // mobile, Lenis kept fighting the hamburger menu's own scroll lock (native
  // touch scroll is fine without it there anyway).
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 992px)', () => {
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

    initLoaderThreeSteps();
    initCardStacking();
    initHeroHeadingStagger();
    initHeroOverlap();
    const cleanServices = initServicesHover();
    const cleanMagnetic = initMagneticButton();

    setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      cleanServices();
      cleanMagnetic();
      gsap.ticker.remove(rafCb);
      lenis.destroy();
    };
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
