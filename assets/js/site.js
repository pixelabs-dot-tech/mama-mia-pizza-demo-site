/* =========================================================================
   MAMA MIA PIZZA — site behaviour
   ========================================================================= */
(function () {
  'use strict';

  /* ---- Edit these to update the site ---- */
  var CONFIG = {
    jeetak: 'https://jeetaklb.com',   // swap for Mama Mia's store link inside jeetak
    instagram: 'https://www.instagram.com/mamamia.pizza961/',
    maps: 'https://www.google.com/maps/search/?api=1&query=Mama+Mia+Pizza+Ras+El+Matn'
  };

  var booted = false;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var hasGsap = !!(G && ST);
  if (hasGsap) G.registerPlugin(ST);

  $$('[data-link]').forEach(function (a) { var u = CONFIG[a.getAttribute('data-link')]; if (u) a.href = u; });

  /* =====================================================================
     SMOOTH SCROLL
     ===================================================================== */
  var lenis = null;
  if (!RM && hasGsap && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.105, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  function scrollToEl(target) {
    var navH = 74;
    if (target === 'top') { if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
    if (lenis) lenis.scrollTo(target, { offset: -navH + 2, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - navH, behavior: RM ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    closeMenu();
    if (id === 'top') { scrollToEl('top'); return; }
    var t = document.getElementById(id);
    if (t) scrollToEl(t);
  });

  /* scroll velocity, shared by the tickers and the wall */
  var vel = { v: 0 };
  function onScrollVel(v) { vel.v = Math.max(-4000, Math.min(4000, v)); }
  if (lenis) lenis.on('scroll', function (l) { onScrollVel(l.velocity * 60); });

  /* =====================================================================
     NAV
     ===================================================================== */
  var nav = $('[data-nav]');
  var lastY = 0;
  function onScroll() {
    var y = window.pageYOffset;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('is-locked')) {
      if (y > 500 && y > lastY + 6) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 500) nav.classList.remove('is-hidden');
    }
    lastY = y;
    eatenUpdate(y);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = $('[data-burger]'), mnav = $('[data-mnav]');
  function closeMenu() {
    if (!burger || burger.getAttribute('aria-expanded') !== 'true') return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open the menu');
    mnav.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      if (!open) { closeMenu(); return; }
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close the menu');
      mnav.classList.add('is-open');
      document.body.classList.add('is-locked');
      nav.classList.remove('is-hidden');
      if (lenis) lenis.stop();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* =====================================================================
     HERO — the sign powers on, dust drifts in its light
     ===================================================================== */
  var hero = $('[data-hero]');
  var heroVisible = true;
  function initHero() {
    if (!hero) return;
    var lit = false;
    function powerOn() {
      if (lit) return; lit = true;
      hero.classList.add('is-lit');
      setTimeout(function () { hero.classList.add('is-steady'); startFlicker(); }, RM ? 0 : 2400);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(powerOn, 120); });
    setTimeout(powerOn, 900);

    /* a tube that misbehaves now and then */
    var parts = $$('.nt', hero).filter(function (n) { return /script|slice|pizza|steam|line/.test(n.getAttribute('data-part')); });
    function startFlicker() {
      if (RM || !parts.length) return;
      (function loop() {
        setTimeout(function () {
          if (heroVisible && !document.hidden) {
            var p = parts[Math.floor(Math.random() * parts.length)];
            p.classList.add('is-flicker');
            setTimeout(function () { p.classList.remove('is-flicker'); }, 650);
          }
          loop();
        }, 3200 + Math.random() * 5200);
      })();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }

    if (RM || !hasGsap) return;
    var inner = $('.hero__in', hero), wall = $('.hero__wall', hero);
    /* the tablecloth slides over the hero */
    G.to(inner, { scale: 0.88, yPercent: -8, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'top top', scrub: true } });
    G.to(wall, { opacity: 0.35, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'top top', scrub: true } });
    /* the sign leans toward the pointer */
    if (FINE) {
      var sign = $('[data-sign]', hero);
      var qx = G.quickTo(sign, 'rotationY', { duration: 0.9, ease: 'power3' });
      var qy = G.quickTo(sign, 'rotationX', { duration: 0.9, ease: 'power3' });
      G.set(sign, { transformPerspective: 900 });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        qx(((e.clientX - r.left) / r.width - 0.5) * 10);
        qy(((e.clientY - r.top) / r.height - 0.5) * -8);
      });
      hero.addEventListener('pointerleave', function () { qx(0); qy(0); });
    }
  }

  /* floating motes (hero) and sparkles (after dark) */
  function particles(canvas, opts) {
    if (!canvas || RM) return;
    var ctx = canvas.getContext('2d'), W = 0, H = 0, raf = 0, running = false, parts = [];
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, first) {
      p.x = Math.random() * W; p.y = first ? Math.random() * H : H * (0.35 + Math.random() * 0.75);
      p.r = opts.rmin + Math.random() * (opts.rmax - opts.rmin);
      p.vx = (Math.random() - 0.5) * opts.drift; p.vy = -(opts.rise * (0.4 + Math.random()));
      p.life = first ? Math.random() * 500 : 0; p.span = 380 + Math.random() * 520;
      p.max = opts.amin + Math.random() * (opts.amax - opts.amin);
      p.c = opts.colors[Math.floor(Math.random() * opts.colors.length)];
      p.tw = Math.random() * 6.283;
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life++; p.x += p.vx; p.y += p.vy; p.tw += 0.08;
        var t = p.life / p.span;
        if (t >= 1 || p.y < -10) { spawn(p); continue; }
        var a = p.max * Math.sin(Math.PI * t) * (opts.twinkle ? 0.55 + 0.45 * Math.sin(p.tw) : 1);
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        if (opts.twinkle && p.r > 1.6) { ctx.fillRect(p.x - p.r * 2.2, p.y - 0.4, p.r * 4.4, 0.8); ctx.fillRect(p.x - 0.4, p.y - p.r * 2.2, 0.8, p.r * 4.4); }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running) return; running = true; size(); raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    for (var i = 0; i < opts.count; i++) { var p = {}; spawn(p, true); parts.push(p); }
    window.addEventListener('resize', function () { if (running) size(); });
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }).observe(canvas);
  }

  /* =====================================================================
     TICKERS, REVEALS, PARALLAX, VIDEOS
     ===================================================================== */
  function initTickers() {
    $$('[data-ticker]').forEach(function (t) { t.innerHTML += t.innerHTML; });
    if (RM) return;
    $$('[data-wall] .wall__row').forEach(function (row) {
      $$('a', row).forEach(function (a) {
        var c = a.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; row.appendChild(c);
      });
    });
    if (RM || !hasGsap) return;
    var tracks = $$('[data-ticker], .wall__row');
    var rate = 1;
    G.ticker.add(function () {
      var target = 1 + Math.min(Math.abs(vel.v) / 700, 5);
      rate += (target - rate) * 0.08;
      vel.v *= 0.92;
      if (Math.abs(rate - 1) < 0.002) rate = 1;
      tracks.forEach(function (t) {
        if (!t.getAnimations) return;
        var an = t.getAnimations();
        for (var i = 0; i < an.length; i++) if (an[i].playState === 'running') an[i].playbackRate = rate;
      });
    });
  }

  function initReveals() {
    $$('.title__l').forEach(function (l) {
      var inner = document.createElement('span'); inner.className = 'rv__in';
      while (l.firstChild) inner.appendChild(l.firstChild);
      l.appendChild(inner); l.classList.add('rv');
    });
    /* clip-path reveals are observed through their parent: Chrome treats a fully
       clipped element as not intersecting, so it would never reveal itself */
    var map = new Map();
    function add(obs, el) { if (!map.has(obs)) map.set(obs, []); map.get(obs).push(el); }
    $$('.rv, [data-fade]').forEach(function (el) { add(el, el); });
    $$('[data-room], .foot__big').forEach(function (el) { add(el.parentNode, el); });
    if (!('IntersectionObserver' in window) || RM) { map.forEach(function (els) { els.forEach(function (t) { t.classList.add('is-in'); }); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        (map.get(e.target) || []).forEach(function (el) {
          var d = 0;
          if (el.classList.contains('rv')) { var sibs = $$('.rv', el.parentNode); d = Math.max(0, sibs.indexOf(el)) * 120; }
          setTimeout(function () { el.classList.add('is-in'); }, d);
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    map.forEach(function (els, obs) { io.observe(obs); });
  }

  function initParallax() {
    if (RM || !hasGsap) return;
    $$('[data-parallax]').forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      G.fromTo(el, { yPercent: -f * 100 }, { yPercent: f * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  function initVideos() {
    var vids = $$('video[data-src]');
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { v.src = v.getAttribute('data-src'); }); return; }
    var load = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var v = e.target;
        if (!v.src) { v.src = v.getAttribute('data-src'); v.load(); }
        load.unobserve(v);
      });
    }, { rootMargin: '600px 600px' });
    var play = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var v = e.target;
        if (RM) return;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    vids.forEach(function (v) { load.observe(v); play.observe(v); });
  }

  /* =====================================================================
     PIZZA LAB — scroll builds the pie, then pick a signature pizza
     ===================================================================== */
  function jkMark() { var m = $('.jkmark'); return m ? m.outerHTML : 'jeetak'; }

  function initLab() {
    var lab = $('[data-lab]');
    if (!lab || !window.MMPizza) return;
    var host = $('[data-pizza]', lab);
    var glow = document.createElement('div'); glow.className = 'lab__glow'; host.appendChild(glow);
    var pizza = window.MMPizza.create(host);
    var steps = $$('.step', lab), dots = $$('[data-lab-dots] li', lab);
    var box = $('[data-pies]', lab), tabs = $('[data-pie-tabs]', lab), panel = $('[data-pie-panel]', lab);
    var PIES = window.MMPizza.PIES, mark = jkMark();
    var built = false, current = null, timer = 0, inView = false, userAt = 0, AUTO = 6500;

    PIES.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'pie-' + p.id;
      b.setAttribute('aria-controls', 'pie-panel'); b.setAttribute('aria-selected', 'false'); b.tabIndex = i ? -1 : 0;
      b.textContent = p.short || p.name;
      b.addEventListener('click', function () { userAt = Date.now(); select(p.id); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var all = $$('button', tabs), k = all.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
        k = (k + all.length) % all.length; all[k].focus(); all[k].click();
      });
      tabs.appendChild(b);
    });
    panel.id = 'pie-panel'; panel.setAttribute('role', 'tabpanel');

    function select(id) {
      current = id;
      var p = PIES.filter(function (x) { return x.id === id; })[0];
      $$('button', tabs).forEach(function (b) { var on = b.id === 'pie-' + id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'pie-' + id);
      panel.innerHTML =
        '<span class="pie__tag">' + p.tag + '</span>' +
        '<h3 class="pie__name">' + p.name + '</h3>' +
        '<p class="pie__line">' + p.line + '</p>' +
        '<p class="pie__desc">' + p.desc + '</p>' +
        (p.sizes ? '<ul class="pie__sizes" aria-label="Sizes and prices">' + p.sizes.map(function (z) { return '<li><span>' + z[0] + '</span><b>$' + z[1] + '</b></li>'; }).join('') + '</ul>'
                 : (p.price ? '<ul class="pie__sizes"><li><b>$' + p.price + '</b></li></ul>' : '')) +
        '<a class="btn btn--cream pie__cta" href="' + CONFIG.jeetak + '" target="_blank" rel="noopener" aria-label="Order ' + p.name + ' on jeetak">Order on ' + mark + '</a>' +
        '<div class="pie__bar" aria-hidden="true"><i></i></div>';
      pizza.showPie(id);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      var bar = $('.pie__bar', panel);
      if (RM || !built || !inView) return;
      var wait = Date.now() - userAt < 14000 ? 14000 : AUTO;
      if (bar) { bar.style.setProperty('--t', wait + 'ms'); bar.classList.add('is-run'); }
      timer = setTimeout(function () {
        var k = PIES.map(function (x) { return x.id; }).indexOf(current);
        select(PIES[(k + 1) % PIES.length].id);
      }, wait);
    }
    function setBuilt(on) {
      if (on === built) return;
      built = on;
      lab.classList.toggle('is-built', on);
      box.hidden = !on;
      if (on) select(current || PIES[0].id);
      else { clearTimeout(timer); pizza.showPie(null); }
    }
    function setStep(i) {
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k <= i); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView) schedule(); else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(host);
    }
    if (RM || !hasGsap) { pizza.setBuild(1); setStep(3); setBuilt(true); return; }

    pizza.setBuild(0); setStep(0);
    /* the pin reports raw progress; the pie eases toward it (a hand-rolled scrub that
       also survives ScrollTrigger.refresh(), which can skip onUpdate) */
    var target = 0, cur = 0;
    function apply() {
      pizza.setBuild(cur);
      setStep(Math.min(3, Math.floor(cur * 4 * 0.9999)));
      setBuilt(cur > 0.985);
    }
    ST.create({
      trigger: lab, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 1.7); },
      pin: $('[data-lab-pin]', lab), anticipatePin: 1,
      onUpdate: function (self) { target = self.progress; },
      onRefresh: function (self) { target = self.progress; }
    });
    G.ticker.add(function () {
      var d = target - cur;
      if (Math.abs(d) < 0.0008) { if (cur !== target) { cur = target; apply(); } return; }
      cur += d * 0.12; apply();
    });
  }

  /* =====================================================================
     CHEESE POUR — scroll scrubs through 60 frames
     ===================================================================== */
  function initPour() {
    var sec = $('[data-pour]');
    if (!sec) return;
    var canvas = $('[data-pour-canvas]', sec), ctx = canvas.getContext('2d');
    var meter = $('[data-meter]', sec), pct = $('[data-meter-pct]', sec);
    var N = 60, imgs = [], cur = -1, started = false;
    function src(i) { return 'assets/seq/pour_' + (i < 9 ? '0' : '') + (i + 1) + '.webp'; }
    function ok(im) { return im && im.complete && im.naturalWidth > 0; }
    function draw(i, force) {
      i = Math.max(0, Math.min(N - 1, i));
      if (i === cur && !force) return;
      var im = imgs[i];
      if (!ok(im)) {
        im = null;
        for (var d = 1; d < N && !im; d++) { if (ok(imgs[i - d])) im = imgs[i - d]; else if (ok(imgs[i + d])) im = imgs[i + d]; }
        if (!im) return;
      } else cur = i;
      ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    }
    var want = 0;
    function load() {
      if (started) return; started = true;
      for (var i = 0; i < N; i++) (function (i) {
        var im = new Image(); im.decoding = 'async';
        im.onload = function () { if (i === want || cur < 0) draw(want, true); };
        im.src = src(i); imgs[i] = im;
      })(i);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: '1400px 0px' });
      io.observe(sec);
    } else load();
    if (RM || !hasGsap) { sec.classList.add('is-done'); return; }
    var tp = 0, cp = 0;
    function apply() {
      want = Math.round(cp * (N - 1));
      draw(want);
      meter.style.transform = 'scaleY(' + cp.toFixed(3) + ')';
      pct.textContent = Math.round(cp * 100) + '%';
      sec.classList.toggle('is-done', cp > 0.86);
    }
    ST.create({
      trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 1.5); },
      pin: $('[data-pour-pin]', sec), anticipatePin: 1,
      onUpdate: function (self) { tp = self.progress; },
      onRefresh: function (self) { tp = self.progress; }
    });
    G.ticker.add(function () {
      var d = tp - cp;
      if (Math.abs(d) < 0.001) { if (cp !== tp) { cp = tp; apply(); } return; }
      cp += d * 0.2; apply();
    });
  }

  /* =====================================================================
     MENU — tabs over the placemat, slice picker, photo peek
     ===================================================================== */
  function initMenu() {
    var M = window.MM_MENU, cats = $('[data-cats]'), list = $('[data-dishes]');
    if (!M || !cats || !list) return;
    var cur = M.currency || '$';
    var TAGS = { 'new': 'New', hot: 'Hot' };
    var DEFAULT_ICON = { starters: 'bread', pastas: 'pasta', pizzas: 'pizza', sandwiches: 'sub', salads: 'salad', desserts: 'cake', drinks: 'cup' };
    var isNH = function (it) { return (it.tags || []).some(function (t) { return t === 'new' || t === 'hot'; }); };
    function itemsFor(id) { return M.items.filter(function (it) { return id === 'new' ? isNH(it) : it.s === id; }); }
    var sections = M.sections.filter(function (s) { return itemsFor(s.id).length; });
    var sel = null;                       // chosen pizza size, e.g. '8 pcs'
    list.id = 'dishes'; list.setAttribute('role', 'tabpanel');
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function money(v) { return cur + (v % 1 ? v.toFixed(2) : v); }
    function priceHTML(it) {
      if (it.sizes) {
        var hit = sel && it.sizes.filter(function (z) { return z[0] === sel; })[0];
        if (hit) return '<small>' + esc(hit[0]) + '</small>' + money(hit[1]);
        return '<small>from</small>' + money(Math.min.apply(null, it.sizes.map(function (z) { return z[1]; })));
      }
      return typeof it.price === 'number' ? money(it.price) : '';
    }

    sections.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'cat-' + s.id; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'dishes');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.tabIndex = i === 0 ? 0 : -1;
      b.innerHTML = (s.icon ? '<svg class="ico" aria-hidden="true"><use href="#i-' + s.icon + '"/></svg>' : '') + esc(s.label) + '<sup>' + itemsFor(s.id).length + '</sup>';
      b.addEventListener('click', function () { show(s.id, true); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var all = $$('button', cats), k = all.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
        k = (k + all.length) % all.length; all[k].focus(); all[k].click();
      });
      cats.appendChild(b);
    });

    var SLICER =
      '<div class="slicer">' +
        '<svg class="slicer__pie" viewBox="-50 -50 100 100" aria-hidden="true">' +
          '<circle r="47" class="sp-crust"/><circle r="40" class="sp-sauce"/><circle r="37" class="sp-cheese"/>' +
          '<g class="sp-peps"><circle cx="-15" cy="-14" r="6.5"/><circle cx="14" cy="-18" r="5.5"/><circle cx="20" cy="9" r="6"/><circle cx="-4" cy="20" r="6"/><circle cx="-22" cy="9" r="5"/><circle cx="3" cy="-1" r="5.5"/></g>' +
          '<g class="sp-cuts">' + [0, 1, 2, 3, 4, 5].map(function () { return '<line x1="0" y1="-48" x2="0" y2="48"/>'; }).join('') + '</g>' +
        '</svg>' +
        '<div class="slicer__copy"><p class="slicer__q" id="slicer-q">How many slices?</p>' +
          '<div class="slicer__btns" role="radiogroup" aria-labelledby="slicer-q">' +
            ['4', '6', '8', '12'].map(function (n) { return '<button type="button" role="radio" aria-checked="false" data-slices="' + n + '">' + n + '</button>'; }).join('') +
          '</div></div>' +
      '</div>';

    function dishHTML(it, k) {
      var plate = it.img
        ? '<span class="dish__plate"><img src="assets/img/menu/' + it.img + '-t.webp" alt="" width="200" height="200" loading="lazy" decoding="async"></span>'
        : '<span class="dish__plate dish__plate--icon"><svg class="ico" aria-hidden="true"><use href="#i-' + (it.icon || DEFAULT_ICON[it.s] || 'pizza') + '"/></svg></span>';
      var tags = (it.tags || []).map(function (t) { return '<span class="tag tag--' + t + '">' + (t === 'hot' ? '<svg class="ico" aria-hidden="true"><use href="#i-flame"/></svg>' : '') + (TAGS[t] || t) + '</span>'; }).join('');
      var sizes = it.sizes ? '<ul class="sizes" aria-label="Sizes and prices">' + it.sizes.map(function (z) {
        return '<li data-size="' + esc(z[0]) + '"' + (sel === z[0] ? ' class="is-on"' : '') + '><span>' + esc(z[0]) + '</span><b>' + money(z[1]) + '</b></li>';
      }).join('') + '</ul>' : '';
      return '<article class="dish" style="--i:' + k + '"' + (it.img ? ' data-peek="assets/img/menu/' + it.img + '.webp"' : '') + '>' + plate +
        '<div class="dish__main"><div class="dish__top"><h3>' + esc(it.name) + '</h3><span class="dish__dots" aria-hidden="true"></span>' +
        '<span class="dish__price" data-k="' + k + '">' + priceHTML(it) + '</span></div>' +
        (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') + sizes + (tags ? '<div class="dish__tags">' + tags + '</div>' : '') + '</div></article>';
    }

    var current = null, shown = [];
    function show(id, user) {
      current = id;
      $$('button', cats).forEach(function (b) {
        var on = b.id === 'cat-' + id;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && user && cats.scrollWidth > cats.clientWidth) cats.scrollTo({ left: b.offsetLeft - cats.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
      });
      list.setAttribute('aria-labelledby', 'cat-' + id);
      shown = itemsFor(id);
      var hasPizza = shown.some(function (it) { return it.s === 'pizzas' && it.sizes; });
      list.innerHTML = (id === 'pizzas' && hasPizza ? SLICER : '') + shown.map(dishHTML).join('');
      if (id === 'pizzas') bindSlicer();
      bindPeek();
      if (hasGsap && booted) { clearTimeout(refreshT); refreshT = setTimeout(function () { ST.refresh(); }, 120); }
    }
    var refreshT = 0;

    function bindSlicer() {
      var pie = $('.slicer__pie', list), btns = $$('[data-slices]', list), lines = $$('.sp-cuts line', list);
      function draw(n) {
        var half = n / 2;
        lines.forEach(function (l, i) {
          var on = i < half;
          l.style.transform = 'rotate(' + (on ? i * 180 / half : 180) + 'deg)';
          l.style.opacity = on ? 1 : 0;
        });
      }
      draw(sel ? parseInt(sel, 10) : 4);
      if (!sel) lines.forEach(function (l) { l.style.opacity = 0; });
      btns.forEach(function (b) {
        if (sel === b.getAttribute('data-slices') + ' pcs') b.setAttribute('aria-checked', 'true');
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-slices') + ' pcs';
          sel = sel === v ? null : v;
          btns.forEach(function (x) { x.setAttribute('aria-checked', x === b && sel ? 'true' : 'false'); });
          draw(sel ? parseInt(sel, 10) : 4);
          if (!sel) lines.forEach(function (l) { l.style.opacity = 0; });
          pie.classList.remove('is-pop'); void pie.getBoundingClientRect(); pie.classList.add('is-pop');
          $$('.dish', list).forEach(function (d, k) {
            var it = shown[k]; if (!it || !it.sizes) return;
            $$('.sizes li', d).forEach(function (li) { li.classList.toggle('is-on', li.getAttribute('data-size') === sel); });
            var p = $('.dish__price', d);
            p.innerHTML = priceHTML(it);
            p.classList.remove('is-flip'); void p.offsetWidth; p.classList.add('is-flip');
          });
        });
      });
    }

    /* photo that follows the pointer over dishes (mouse only) */
    var peek = null, qx, qy, qr, lastX = 0;
    function bindPeek() {
      if (!FINE || !hasGsap || RM) return;
      if (!peek) {
        peek = document.createElement('div'); peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
        peek.innerHTML = '<img alt="">'; document.body.appendChild(peek);
        qx = G.quickTo(peek, 'x', { duration: 0.55, ease: 'power3' });
        qy = G.quickTo(peek, 'y', { duration: 0.55, ease: 'power3' });
        qr = G.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3' });
        list.addEventListener('pointermove', function (e) {
          qx(e.clientX + 28); qy(e.clientY - 110);
          qr(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6)));
          lastX = e.clientX;
        });
      }
      $$('.dish[data-peek]', list).forEach(function (d) {
        d.addEventListener('pointerenter', function (e) {
          if (e.pointerType !== 'mouse') return;
          var img = $('img', peek), src = d.getAttribute('data-peek');
          if (img.getAttribute('src') !== src) img.src = src;
          G.set(peek, { x: e.clientX + 28, y: e.clientY - 110 }); lastX = e.clientX;
          peek.classList.add('is-on');
        });
        d.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); qr(0); });
      });
    }

    var start = sections.filter(function (s) { return s.id === 'pizzas'; })[0] || sections[0];
    if (sections.length) show(start.id, false);
    $$('button', cats).forEach(function (b) { b.tabIndex = b.id === 'cat-' + start.id ? 0 : -1; b.setAttribute('aria-selected', b.id === 'cat-' + start.id ? 'true' : 'false'); });
  }

  /* =====================================================================
     FOOD — horizontal strip pinned on wide screens
     ===================================================================== */
  function initFood() {
    var sec = $('[data-food]'), track = $('[data-food-track]', sec);
    if (!sec || !track || RM || !hasGsap) return;
    var mm = G.matchMedia();
    mm.add('(min-width: 900px)', function () {
      function dist() { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); }
      var tw = G.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: $('[data-food-pin]', sec), scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true }
      });
      var cards = $$('.fcard', track), skew = G.quickTo(cards, 'skewX', { duration: 0.5, ease: 'power3' });
      var trig = ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: function (self) { skew(Math.max(-7, Math.min(7, self.getVelocity() / -320))); } });
      return function () { tw.kill(); trig.kill(); G.set(track, { clearProps: 'x' }); G.set(cards, { clearProps: 'skewX' }); };
    });
  }

  /* =====================================================================
     AFTER DARK + JEETAK
     ===================================================================== */
  function initNight() {
    var t = $('.night__title .neontxt');
    if (!t) return;
    if (RM || !('IntersectionObserver' in window)) { t.classList.add('is-on'); return; }
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      t.classList.add('is-on', 'is-flick');
      setInterval(function () {
        t.classList.remove('is-flick'); void t.offsetWidth; t.classList.add('is-flick');
      }, 9000 + Math.random() * 4000);
    }, { threshold: 0.6 });
    io.observe(t);
    particles($('[data-sparks]'), { count: 60, rmin: 0.6, rmax: 2.2, drift: 0.12, rise: 0.06, amin: 0.2, amax: 0.85, twinkle: true, colors: ['#ff8cc6', '#ffffff', '#ff5a6e', '#ffd1e6'] });
  }

  function initJeetak() {
    var band = $('[data-jkband]');
    if (!band) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { nav.classList.toggle('is-jk', en[0].isIntersecting); }, { threshold: 0.25 }).observe(band);
    }
    var scene = $('[data-jkscene]', band);
    var motion = scene && scene.querySelector('animateMotion');
    if (RM || !('IntersectionObserver' in window)) { band.classList.add('is-in'); return; }
    band.classList.add('is-armed');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      band.classList.add('is-in');
      if (motion && motion.beginElementAt) { try { motion.beginElementAt(0.6); } catch (e) { /* SMIL unsupported */ } }
    }, { threshold: 0.3 });
    io.observe(scene || band);
  }

  /* =====================================================================
     SCROLL PIZZA — a slice disappears as you scroll
     ===================================================================== */
  var eaten = $('[data-eaten]'), eatClip = $('[data-eaten-clip]');
  function eatenUpdate(y) {
    if (!eaten) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    eaten.classList.toggle('is-on', y > window.innerHeight * 0.9);
    var a = p * Math.PI * 2 * 0.985;
    if (a < 0.01) { eatClip.setAttribute('d', 'M-50-50h100v100h-100z'); return; }
    var R = 60, s = -Math.PI / 2 + a, e = -Math.PI / 2 + Math.PI * 2;
    var large = (e - s) > Math.PI ? 1 : 0;
    eatClip.setAttribute('d', 'M0 0L' + (Math.cos(s) * R).toFixed(2) + ' ' + (Math.sin(s) * R).toFixed(2) +
      'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + (Math.cos(e) * R).toFixed(2) + ' ' + (Math.sin(e) * R).toFixed(2) + 'Z');
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  initHero();
  particles($('[data-dust]'), { count: 70, rmin: 0.5, rmax: 1.9, drift: 0.16, rise: 0.22, amin: 0.12, amax: 0.55, twinkle: false, colors: ['#ff6b74', '#ffb3a8', '#fff0e2', '#ff4757'] });
  initTickers();
  initReveals();
  initVideos();
  initLab();
  initPour();
  initMenu();
  initFood();
  initParallax();
  initNight();
  initJeetak();
  onScroll();
  booted = true;

  if (hasGsap) {
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }
})();
