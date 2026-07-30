/* ═══════════════════════════════════════════════════════════════
   3D Clinostat — ECE/BME 499 capstone showcase
   No dependencies. Everything degrades gracefully without JS.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────── Mobile navigation ─────────── */

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');

  if (nav && navToggle) {
    const setNav = (open) => {
      nav.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };

    navToggle.addEventListener('click', () => {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') setNav(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setNav(false);
    });
  }

  /* ─────────── Sticky bar + scroll progress ─────────── */

  const topbar = document.getElementById('topbar');
  const progress = document.getElementById('scrollProgress');

  const onScroll = () => {
    const y = window.scrollY;
    if (topbar) topbar.classList.toggle('stuck', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  };

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  /* ─────────── Scrollspy ─────────── */

  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ─────────── Reveal on scroll ─────────── */

  const revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('in'));
  } else {
    const revealer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    revealables.forEach((el) => revealer.observe(el));
  }

  /* ─────────── Lightbox ─────────── */

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCap = document.getElementById('lightboxCap');
  const lightboxClose = document.getElementById('lightboxClose');
  let lastFocused = null;

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  if (lightbox && lightboxImg) {
    document.querySelectorAll('img[data-zoom]').forEach((img) => {
      img.addEventListener('click', () => {
        lastFocused = document.activeElement;
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt;
        const caption = img.closest('figure')?.querySelector('figcaption');
        if (lightboxCap) lightboxCap.textContent = caption ? caption.textContent.trim() : '';
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        lightboxClose?.focus();
      });
    });

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target === lightboxCap) closeLightbox();
    });
    lightboxClose?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLightbox();
    });
  }

  /* ─────────── Report embed: hide the frame when there is no PDF ───────────
     Browsers silently render an empty <object> when the resource 404s, so we
     ask the server directly and let the fallback markup take over instead. */

  const reportEmbed = document.getElementById('reportEmbed');
  const reportObject = reportEmbed?.querySelector('object');

  if (reportObject) {
    const showFallback = () => {
      reportEmbed.innerHTML = reportObject.innerHTML;
      reportEmbed.classList.add('is-empty');
    };

    fetch(reportObject.getAttribute('data'), { method: 'HEAD' })
      .then((response) => {
        const type = response.headers.get('content-type') || '';
        if (!response.ok || !type.includes('pdf')) showFallback();
      })
      .catch(showFallback);
  }

  /* ═══════════════════════════════════════════════════════════════
     Canvas: the gravity vector sweeping a sphere.

     Both canvases render the same idea as the app's gravity-sphere
     view — a unit gravity vector reoriented by two perpendicular
     axes, tracing a path that eventually covers the sphere. The
     hero version is ambient; the live-card version is a compact
     instrument read-out.
     ═══════════════════════════════════════════════════════════════ */

  const INK = 'rgba(240, 236, 229,';
  const ACCENT = '#d8a94e';
  const MEASURED = '#6ea8d8';

  /** Rotate about X, then about Y — the clinostat's two axes. */
  function orient(inner, outer) {
    const ci = Math.cos(inner);
    const si = Math.sin(inner);
    const co = Math.cos(outer);
    const so = Math.sin(outer);
    // Gravity points down in the lab frame; express it in the sample frame.
    const x = -so * ci;
    const y = -ci * co;
    const z = si;
    return { x, y, z };
  }

  function project(p, radius, tilt) {
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const y = p.y * ct - p.z * st;
    const z = p.y * st + p.z * ct;
    const depth = (z + 1.6) / 2.6;
    return { x: p.x * radius, y: y * radius, depth };
  }

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function drawSphere(ctx, cx, cy, radius, tilt, alpha) {
    ctx.lineWidth = 1;

    // Meridians and parallels
    for (let m = 0; m < 6; m++) {
      const lon = (m / 6) * Math.PI;
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const lat = (i / 72) * Math.PI * 2;
        const p = project(
          {
            x: Math.sin(lat) * Math.cos(lon),
            y: Math.cos(lat),
            z: Math.sin(lat) * Math.sin(lon)
          },
          radius,
          tilt
        );
        ctx[i ? 'lineTo' : 'moveTo'](cx + p.x, cy + p.y);
      }
      ctx.strokeStyle = INK + alpha * 0.55 + ')';
      ctx.stroke();
    }

    for (let p1 = 1; p1 < 6; p1++) {
      const lat = (p1 / 6) * Math.PI;
      const r = Math.sin(lat);
      const yy = Math.cos(lat);
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const lon = (i / 72) * Math.PI * 2;
        const p = project(
          { x: r * Math.cos(lon), y: yy, z: r * Math.sin(lon) },
          radius,
          tilt
        );
        ctx[i ? 'lineTo' : 'moveTo'](cx + p.x, cy + p.y);
      }
      ctx.strokeStyle = INK + alpha * 0.4 + ')';
      ctx.stroke();
    }
  }

  /* The trail is drawn in a handful of constant-alpha bands rather than one
     stroke per segment — same fade, a fraction of the draw calls. */
  const TRAIL_BANDS = 7;

  function drawTrail(ctx, cx, cy, radius, tilt, t, span, step, color, width) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';

    const perBand = Math.ceil(span / TRAIL_BANDS);

    for (let band = 0; band < TRAIL_BANDS; band++) {
      const start = band * perBand;
      const end = Math.min(span, start + perBand + 1);
      if (start >= span) break;

      ctx.beginPath();
      for (let i = start; i < end; i++) {
        const tt = t - i * step;
        if (tt < 0) break;
        const p = project(orient(tt * 0.9, tt * 0.4), radius, tilt);
        ctx[i === start ? 'moveTo' : 'lineTo'](cx + p.x, cy + p.y);
      }
      ctx.globalAlpha = (1 - band / TRAIL_BANDS) * 0.7;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawVector(ctx, cx, cy, radius, tilt, t) {
    const tip = project(orient(t * 0.9, t * 0.4), radius, tilt);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + tip.x, cy + tip.y);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.4 + tip.depth * 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + tip.x, cy + tip.y, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function animate(canvas, options) {
    if (!canvas) return;

    let frame = null;
    let surface = setupCanvas(canvas);
    let t = options.startAt;
    let running = true;

    window.addEventListener(
      'resize',
      () => {
        surface = setupCanvas(canvas);
        kick();
      },
      { passive: true }
    );

    const render = () => {
      frame = null;
      const { ctx, w, h } = surface;
      const cx = w * options.cx;
      const cy = h * options.cy;
      const radius = Math.min(w, h) * options.radius;

      ctx.clearRect(0, 0, w, h);
      drawSphere(ctx, cx, cy, radius, options.tilt, options.gridAlpha);
      drawTrail(ctx, cx, cy, radius, options.tilt, t, options.trail, 0.05, MEASURED, options.trailWidth);
      drawVector(ctx, cx, cy, radius, options.tilt, t);

      // A still frame is enough when the canvas is off-screen, the tab is
      // backgrounded, or the visitor asked for reduced motion.
      if (!running || reduceMotion || document.hidden) return;
      t += options.speed;
      frame = window.requestAnimationFrame(render);
    };

    const kick = () => {
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        running = entries[0].isIntersecting;
        if (running) kick();
      }).observe(canvas);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) kick();
    });

    kick();
  }

  animate(document.getElementById('heroCanvas'), {
    cx: 0.72,
    cy: 0.5,
    radius: 0.35,
    tilt: 0.42,
    speed: 0.006,
    trail: 460,
    trailWidth: 1,
    gridAlpha: 0.3,
    startAt: 30
  });

  animate(document.getElementById('vectorCanvas'), {
    cx: 0.5,
    cy: 0.46,
    radius: 0.4,
    tilt: 0.4,
    speed: 0.009,
    trail: 280,
    trailWidth: 1.3,
    gridAlpha: 0.28,
    startAt: 18
  });
})();
