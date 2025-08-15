(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // --- Mobile nav toggle ---
  const toggle = $('.nav-toggle');
  const nav    = $('#nav');

  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const openNav = () => {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeNav() : openNav();
    });

    // Close on link click
    $$('.nav-link', nav).forEach(a => a.addEventListener('click', closeNav));

    // Close on ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeNav();
    });
  }

  // --- Active link highlight on scroll ---
  const links = $$('.nav-link[href^="#"]'); // only in-page anchors
  const secs  = links.map(a => $(a.hash)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(a => a.classList.toggle('active', a.hash === `#${visible.target.id}`));
    }, { rootMargin: '-45% 0px -50% 0px', threshold: [0.15, 0.35, 0.6] });

    secs.forEach(sec => io.observe(sec));
  }

  // --- Slower smooth scroll for in-page anchors ---
  const SCROLL_DURATION = 900; // ms

  const easeInOutQuad = t => (t < 0.5)
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const getScrollOffset = () => {
    const cs = getComputedStyle(document.documentElement);
    const navH = parseInt(cs.getPropertyValue('--nav-h')) || 64;
    return navH + 24; // matches section scroll-margin-top
  };

  function animateScrollTo(targetY, duration) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, targetY);
      return;
    }
    const startY  = window.pageYOffset;
    const delta   = targetY - startY;
    const startTs = performance.now();

    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    function step(now) {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = easeInOutQuad(t);
      window.scrollTo(0, startY + delta * eased);
      if (t < 1) requestAnimationFrame(step);
      else root.style.scrollBehavior = prevBehavior || '';
    }
    requestAnimationFrame(step);
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const raw = a.getAttribute('href');
      if (!raw || raw === '#') return;
      const id = decodeURIComponent(raw.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }

      const offset = getScrollOffset();
      const targetY = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - offset);
      animateScrollTo(targetY, SCROLL_DURATION);

      history.pushState(null, '', `#${id}`);
      setTimeout(() => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, SCROLL_DURATION + 30);
    });
  });
})();
