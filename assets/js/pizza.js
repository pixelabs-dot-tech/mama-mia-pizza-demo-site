/* =========================================================================
   Mama Mia — illustrated pizza for "How a pie happens".
   MMPizza.create(host) draws an SVG pizza and returns:
     setBuild(p)   p 0..1 : dough -> sauce -> cheese -> oven
     showPie(id)   drop a signature pie's toppings on (old ones fly off)
     PIES          the signature pies (copy lives here with the recipes)
   Everything is generated from seeded randomness, so every visit draws the same pies.
   ========================================================================= */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var R = 460;              // crust radius
  var INNER = 372;          // toppings stay inside this radius

  var PZ_A = [['4 pcs', 9], ['6 pcs', 14], ['8 pcs', 16], ['12 pcs', 18]];
  var PZ_B = [['4 pcs', 8], ['6 pcs', 13], ['8 pcs', 15], ['12 pcs', 17]];
  var PIES = [
    { id: 'special', short: 'Special', name: 'Mama Mia Special', tag: 'Hot', line: 'Our signature.',
      desc: 'Ham, pepperoni, salami and mushrooms.', sizes: PZ_A },
    { id: 'afterdark', short: 'After Dark', name: 'After Dark', tag: 'New', line: 'Bold. Spicy. Unforgettable.',
      desc: 'Pepperoni, ham, mushroom and olives.', sizes: PZ_A },
    { id: 'pepperoni', short: 'Pepperoni', name: 'Pepperoni', tag: 'Classic', line: 'Because pepperoni makes life better.',
      desc: 'Classic pepperoni and mozzarella cheese.', sizes: PZ_A },
    { id: 'veg', short: 'Vegetarian', name: 'Vegetarian', tag: 'Veggie', line: 'All the good stuff, no meat.',
      desc: 'Mushrooms, green peppers and onions.', sizes: PZ_B },
    { id: 'dessert', short: 'Dessert', name: 'Peanut Butter Chocolate Melt', tag: 'New · Sweet', line: 'One slice and you’re in dessert heaven.',
      desc: 'Melted chocolate, marshmallow and peanut butter.', price: 15 }
  ];

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function n1(v) { return Math.round(v * 10) / 10; }
  function blob(r, wob, n, rand, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    var pts = [], i;
    for (i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, rr = r * (1 + (rand() - 0.5) * wob);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    var d = '';
    for (i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) d += 'M' + n1(p1[0]) + ' ' + n1(p1[1]);
      d += 'C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
           n1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ' ' + n1(p2[1]);
    }
    return d + 'Z';
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function back(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  /* scatter points inside the pie, keeping a gap from everything already placed */
  function scatter(rand, placed, count, rad, gap, maxR) {
    var out = [], tries = 0;
    maxR = maxR || INNER;
    while (out.length < count && tries < count * 400) {
      tries++;
      var a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (maxR - rad);
      var x = Math.cos(a) * d, y = Math.sin(a) * d, ok = true;
      for (var i = 0; i < placed.length; i++) {
        var q = placed[i], dx = q.x - x, dy = q.y - y;
        if (dx * dx + dy * dy < Math.pow((q.r + rad) * gap, 2)) { ok = false; break; }
      }
      if (ok) { var pt = { x: x, y: y, r: rad }; out.push(pt); placed.push(pt); }
    }
    return out;
  }

  /* ---------- topping drawings, each around (0,0) ---------- */
  var DRAW = {
    pepperoni: function (g, r, rand) {
      el('circle', { r: r, fill: 'url(#pz-pep)' }, g);
      el('circle', { r: n1(r * 0.8), fill: 'none', stroke: 'rgba(255,200,170,.16)', 'stroke-width': 2.5 }, g);
      for (var i = 0; i < 6; i++) {
        var a = rand() * 6.283, d = rand() * r * 0.7;
        el('circle', { cx: n1(Math.cos(a) * d), cy: n1(Math.sin(a) * d), r: n1(1.6 + rand() * 2.4), fill: 'rgba(95,18,8,.38)' }, g);
      }
      el('ellipse', { cx: n1(-r * 0.36), cy: n1(-r * 0.38), rx: n1(r * 0.28), ry: n1(r * 0.12), transform: 'rotate(-38)', fill: 'rgba(255,255,255,.2)' }, g);
    },
    ham: function (g, r, rand) {
      var w = 40 + rand() * 10, h = 30 + rand() * 8;
      el('rect', { x: n1(-w / 2), y: n1(-h / 2), width: n1(w), height: n1(h), rx: 7, fill: '#f0a4a0', stroke: '#d9827d', 'stroke-width': 3 }, g);
      el('path', { d: 'M' + n1(-w / 2 + 7) + ' ' + n1(-h / 2 + 9) + 'Q0 ' + n1(-h / 2 + 2) + ' ' + n1(w / 2 - 8) + ' ' + n1(-h / 2 + 10), fill: 'none', stroke: 'rgba(255,240,236,.75)', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    },
    salami: function (g, r, rand) {
      el('circle', { r: r, fill: '#8e2230', stroke: '#6a1420', 'stroke-width': 3 }, g);
      for (var i = 0; i < 9; i++) {
        var a = rand() * 6.283, d = Math.sqrt(rand()) * r * 0.78;
        el('ellipse', { cx: n1(Math.cos(a) * d), cy: n1(Math.sin(a) * d), rx: n1(2.4 + rand() * 2.6), ry: n1(1.8 + rand() * 1.8), transform: 'rotate(' + n1(rand() * 180) + ' ' + n1(Math.cos(a) * d) + ' ' + n1(Math.sin(a) * d) + ')', fill: '#f6d9d4' }, g);
      }
      el('ellipse', { cx: n1(-r * 0.36), cy: n1(-r * 0.4), rx: n1(r * 0.26), ry: n1(r * 0.1), transform: 'rotate(-38)', fill: 'rgba(255,255,255,.18)' }, g);
    },
    greenpepper: function (g, r, rand) {
      var rr = 26 + rand() * 8, span = 2.3 + rand() * 0.8, a0 = -span / 2;
      var d = 'M' + n1(Math.cos(a0) * rr) + ' ' + n1(Math.sin(a0) * rr) + 'A' + n1(rr) + ' ' + n1(rr) + ' 0 0 1 ' + n1(Math.cos(a0 + span) * rr) + ' ' + n1(Math.sin(a0 + span) * rr);
      el('path', { d: d, fill: 'none', stroke: '#2f7d32', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
      el('path', { d: d, fill: 'none', stroke: '#6fbf4f', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
    },
    mushroom: function (g) {
      el('path', { d: 'M-34 4C-34-24 34-24 34 4C34 10 22 10 14 9L13 30C13 36-13 36-13 30L-14 9C-22 10-34 10-34 4Z', fill: '#ece0cc', stroke: '#8b6849', 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, g);
      el('path', { d: 'M-25 3C-25-11 25-11 25 3', fill: 'none', stroke: 'rgba(139,104,73,.35)', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    },
    olive: function (g) {
      el('circle', { r: 15, fill: 'none', stroke: '#221c19', 'stroke-width': 10 }, g);
      el('path', { d: 'M-13 -6A14 14 0 0 1 -2 -14', fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    },
    onion: function (g, r, rand) {
      var rr = 30 + rand() * 10, span = 2.0 + rand() * 1.2, a0 = -span / 2;
      function arc(rad) {
        return 'M' + n1(Math.cos(a0) * rad) + ' ' + n1(Math.sin(a0) * rad) + 'A' + n1(rad) + ' ' + n1(rad) + ' 0 0 1 ' +
          n1(Math.cos(a0 + span) * rad) + ' ' + n1(Math.sin(a0 + span) * rad);
      }
      el('path', { d: arc(rr), fill: 'none', stroke: '#9b3c78', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('path', { d: arc(rr - 8), fill: 'none', stroke: '#e4b9d3', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    },
    jalapeno: function (g) {
      el('circle', { r: 18, fill: '#5d9c35', stroke: '#3c6f22', 'stroke-width': 5 }, g);
      el('circle', { r: 9, fill: '#d6e7a5' }, g);
      for (var i = 0; i < 5; i++) {
        var a = i / 5 * 6.283;
        el('ellipse', { cx: n1(Math.cos(a) * 7), cy: n1(Math.sin(a) * 7), rx: 2.2, ry: 3.6, transform: 'rotate(' + n1(a * 57.3 + 90) + ' ' + n1(Math.cos(a) * 7) + ' ' + n1(Math.sin(a) * 7) + ')', fill: '#f4f0cc' }, g);
      }
    },
    basil: function (g) {
      el('path', { d: 'M0-38C26-23 26 19 0 38C-26 19-26-23 0-38Z', fill: 'url(#pz-basil)' }, g);
      el('path', { d: 'M0-31V31M0-8L12-18M0 6L13-3M0-8L-12-18M0 6L-13-3', fill: 'none', stroke: 'rgba(255,255,255,.26)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    },
    mozz: function (g, r, rand) {
      el('path', { d: blob(r, 0.32, 7, rand), fill: 'url(#pz-mozz)' }, g);
    },
    chili: function (g) {
      el('path', { d: 'M-40 0C-30-13 18-15 38-5C43-2 43 4 38 6C18 13-28 15-40 0Z', fill: '#d4261b' }, g);
      el('path', { d: 'M-26-5C-8-11 16-11 30-6', fill: 'none', stroke: 'rgba(255,255,255,.32)', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M-40 0C-50-3-55-11-51-18', fill: 'none', stroke: '#3d7a29', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, g);
    },
    marshmallow: function (g, r, rand) {
      var tints = ['#fff9f1', '#f7b9cb', '#cfe8b3', '#fff9f1', '#f9cfdc'];
      el('rect', { x: -18, y: -14, width: 36, height: 28, rx: 11, fill: tints[Math.floor(rand() * tints.length)], stroke: 'rgba(80,40,20,.12)', 'stroke-width': 2 }, g);
      el('path', { d: 'M-10-7C-4-10 6-10 10-7', fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
    },
    candy: function (g, r, rand) {
      var cs = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#8e24aa'];
      el('circle', { r: 10, fill: cs[Math.floor(rand() * cs.length)] }, g);
      el('ellipse', { cx: -3, cy: -4, rx: 4, ry: 2.2, fill: 'rgba(255,255,255,.55)', transform: 'rotate(-30 -3 -4)' }, g);
    },
    pb: function (g, r, rand) {
      var L = 60 + rand() * 40;
      var d = 'M' + (-L) + ' 0C' + n1(-L / 2) + ' -26 ' + n1(-L / 4) + ' 26 0 0S' + n1(L / 2) + ' -26 ' + L + ' 0';
      el('path', { d: d, fill: 'none', stroke: '#cf9449', 'stroke-width': 12, 'stroke-linecap': 'round' }, g);
      el('path', { d: d, fill: 'none', stroke: '#ebc183', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    }
  };

  function flecks(parent, rand, count, colors, rmin, rmax) {
    var g = el('g', { 'class': 'pz-flecks' }, parent);
    for (var i = 0; i < count; i++) {
      var a = rand() * 6.283, d = Math.sqrt(rand()) * INNER, s = rmin + rand() * (rmax - rmin);
      var x = Math.cos(a) * d, y = Math.sin(a) * d, b = rand() * 6.283;
      el('path', {
        d: 'M' + n1(x + Math.cos(b) * s) + ' ' + n1(y + Math.sin(b) * s) + 'L' + n1(x + Math.cos(b + 2.3) * s * 0.8) + ' ' + n1(y + Math.sin(b + 2.3) * s * 0.8) +
           'L' + n1(x + Math.cos(b + 4.1) * s * 0.7) + ' ' + n1(y + Math.sin(b + 4.1) * s * 0.7) + 'Z',
        fill: colors[Math.floor(rand() * colors.length)]
      }, g);
    }
    return g;
  }

  /* recipe: list of [type, count, radius, gap] placed big-to-small */
  var RECIPES = {
    special: { seed: 11, items: [['salami', 8, 46, 0.97], ['pepperoni', 9, 38, 0.97], ['ham', 9, 26, 1.05], ['mushroom', 9, 40, 0.9]], flecks: [50, ['#4b6b2a', '#3c5a22'], 2.5, 4.5] },
    pepperoni: { seed: 23, items: [['pepperoni', 21, 44, 0.97]], flecks: [80, ['#4b6b2a', '#3c5a22', '#6a8a3a'], 3, 5.5] },
    afterdark: { seed: 37, items: [['pepperoni', 12, 42, 0.98], ['ham', 8, 26, 1.0], ['mushroom', 7, 40, 0.92], ['olive', 11, 20, 1.1]], flecks: [100, ['#c1351e', '#e25a23', '#9e2812'], 3.5, 7.5] },
    veg: { seed: 53, items: [['mushroom', 11, 42, 0.92], ['greenpepper', 11, 34, 0.7], ['onion', 11, 38, 0.66]], flecks: [40, ['#4b6b2a', '#3c5a22'], 2.5, 4.5] },
    dessert: { seed: 41, items: [['marshmallow', 16, 28, 1.1], ['pb', 6, 54, 0.55], ['candy', 24, 13, 1.35]], drizzle: true }
  };

  function create(host) {
    var svg = el('svg', { viewBox: '-540 -540 1080 1080', 'class': 'pz', 'aria-hidden': 'true', focusable: 'false' }, null);
    var defs = el('defs', {}, svg);
    function radial(id, stops, attrs) {
      var g = el('radialGradient', Object.assign({ id: id }, attrs || {}), defs);
      stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, g); });
    }
    radial('pz-crust', [[0, '#f7d9a2'], [0.8, '#f2c47e'], [0.9, '#e0a052'], [0.965, '#c47c36'], [1, '#a8652b']], { cx: 0, cy: 0, r: R, gradientUnits: 'userSpaceOnUse' });
    radial('pz-baked', [[0.82, 'rgba(170,90,30,0)'], [0.9, 'rgba(160,82,26,.55)'], [0.97, 'rgba(120,58,18,.85)'], [1, 'rgba(90,40,12,.95)']], { cx: 0, cy: 0, r: R, gradientUnits: 'userSpaceOnUse' });
    radial('pz-sauce', [[0, '#dc4a2c'], [0.7, '#c93a22'], [1, '#a82a18']], { cx: 0, cy: 0, r: 420, gradientUnits: 'userSpaceOnUse' });
    radial('pz-choc', [[0, '#74412a'], [0.75, '#55301d'], [1, '#3c2013']], { cx: 0, cy: 0, r: 420, gradientUnits: 'userSpaceOnUse' });
    radial('pz-cheese', [[0, '#fff3cc'], [0.6, '#fde6a8'], [1, '#f7d488']]);
    radial('pz-mozz', [[0, '#ffffff'], [0.7, '#fbf6ec'], [1, '#e9dcc4']]);
    radial('pz-pep', [[0, '#cc4a32'], [0.72, '#b2361f'], [1, '#86230f']]);
    radial('pz-pan', [[0.88, '#2a2a2e'], [0.955, '#4b4b52'], [0.985, '#2c2c30'], [1, '#18181b']], { cx: 0, cy: 0, r: 508, gradientUnits: 'userSpaceOnUse' });
    var lg = el('linearGradient', { id: 'pz-basil', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#62ad4a' }, lg); el('stop', { offset: 1, 'stop-color': '#2d6b29' }, lg);
    var blur = el('filter', { id: 'pz-soft', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    el('feGaussianBlur', { stdDeviation: 3 }, blur);
    /* melted cheese: blobs fuse together (blur + alpha threshold) */
    var goo = el('filter', { id: 'pz-goo', filterUnits: 'userSpaceOnUse', x: -470, y: -470, width: 940, height: 940, 'color-interpolation-filters': 'sRGB' }, defs);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: 14, result: 'b' }, goo);
    el('feColorMatrix', { 'in': 'b', mode: 'matrix', values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11', result: 'g' }, goo);

    /* sauce spreads in a spiral: mask path drawn with dashoffset */
    var mask = el('mask', { id: 'pz-spiral', maskUnits: 'userSpaceOnUse', x: -540, y: -540, width: 1080, height: 1080 }, defs);
    var sp = '', turns = 6.4, stepA = 0.12;
    for (var a = 0; a <= turns * 6.283; a += stepA) {
      var rr = 8 + a / (turns * 6.283) * 430;
      sp += (sp ? 'L' : 'M') + n1(Math.cos(a) * rr) + ' ' + n1(Math.sin(a) * rr);
    }
    var spiral = el('path', { d: sp, fill: 'none', stroke: '#fff', 'stroke-width': 86, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, mask);

    el('circle', { r: 506, fill: 'url(#pz-pan)', 'class': 'pz-pan' }, svg);
    el('circle', { r: 497, fill: 'none', stroke: 'rgba(255,255,255,.07)', 'stroke-width': 3 }, svg);

    var spin = el('g', { 'class': 'pz-spin' }, svg);
    var rand = rng(7);

    /* dough */
    var dough = el('g', { 'class': 'pz-dough' }, spin);
    el('path', { d: blob(R, 0.025, 28, rand), fill: 'url(#pz-crust)' }, dough);
    var baked = el('path', { d: blob(R, 0.025, 28, rng(7)), fill: 'url(#pz-baked)', opacity: 0 }, dough);
    var char = el('g', { opacity: 0 }, dough);
    for (var i = 0; i < 26; i++) {
      var ca = rand() * 6.283, cd = 418 + rand() * 34;
      el('ellipse', { cx: n1(Math.cos(ca) * cd), cy: n1(Math.sin(ca) * cd), rx: n1(6 + rand() * 12), ry: n1(4 + rand() * 6), transform: 'rotate(' + n1(ca * 57.3) + ' ' + n1(Math.cos(ca) * cd) + ' ' + n1(Math.sin(ca) * cd) + ')', fill: 'rgba(92,44,14,.55)' }, char);
    }
    var flour = el('g', { opacity: 1 }, dough);
    for (i = 0; i < 70; i++) {
      var fa = rand() * 6.283, fd = Math.sqrt(rand()) * 440;
      el('circle', { cx: n1(Math.cos(fa) * fd), cy: n1(Math.sin(fa) * fd), r: n1(1.5 + rand() * 3), fill: 'rgba(255,255,255,.55)' }, flour);
    }

    /* sauce (red) and chocolate base for dessert */
    var sauce = el('g', { mask: 'url(#pz-spiral)', 'class': 'pz-sauce' }, spin);
    var sauceRed = el('path', { d: blob(408, 0.05, 22, rand), fill: 'url(#pz-sauce)' }, sauce);
    var sauceChoc = el('path', { d: blob(406, 0.06, 22, rng(99)), fill: 'url(#pz-choc)', 'class': 'pz-choc', style: 'opacity:0' }, sauce);
    var herbs = flecks(sauce, rand, 55, ['rgba(70,30,10,.35)', 'rgba(60,90,30,.45)'], 2, 4);

    /* cheese */
    var cheese = el('g', { 'class': 'pz-cheese' }, spin);
    var melt = el('g', { filter: 'url(#pz-goo)' }, cheese);
    var cheeseBlobs = [];
    var cr = rng(5), cplaced = [];
    var cpts = scatter(cr, cplaced, 40, 70, 0.72, 392);
    cpts.sort(function (p, q) { return (p.x + p.y * 0.6) - (q.x + q.y * 0.6); });
    cpts.forEach(function (p) {
      var g = el('g', { transform: 'translate(' + n1(p.x) + ' ' + n1(p.y) + ') scale(0)' }, melt);
      el('path', { d: blob(p.r * (0.9 + cr() * 0.4), 0.4, 9, cr), fill: 'url(#pz-cheese)' }, g);
      cheeseBlobs.push({ g: g, x: p.x, y: p.y });
    });
    var gloss = el('g', { opacity: 0 }, cheese);
    for (var gi = 0; gi < 34; gi++) {
      var ga = cr() * 6.283, gd = Math.sqrt(cr()) * 360;
      el('ellipse', { cx: n1(Math.cos(ga) * gd), cy: n1(Math.sin(ga) * gd), rx: n1(8 + cr() * 16), ry: n1(4 + cr() * 7), transform: 'rotate(' + n1(cr() * 180) + ' ' + n1(Math.cos(ga) * gd) + ' ' + n1(Math.sin(ga) * gd) + ')', fill: 'rgba(255,250,232,.75)' }, gloss);
    }
    var spots = el('g', { opacity: 0 }, cheese);
    for (i = 0; i < 46; i++) {
      var sa = cr() * 6.283, sd = Math.sqrt(cr()) * 380;
      el('path', { d: blob(5 + cr() * 9, 0.5, 6, cr, Math.cos(sa) * sd, Math.sin(sa) * sd), fill: 'rgba(196,120,42,.5)' }, spots);
    }

    /* toppings per pie */
    var tops = el('g', { 'class': 'pz-tops' }, spin);
    var pieGroups = {};
    PIES.forEach(function (pie) {
      var rec = RECIPES[pie.id], r2 = rng(rec.seed), placed = [];
      var g = el('g', { 'class': 'pz-pie', 'data-pie': pie.id }, tops);
      var k = 0;
      if (rec.drizzle) {
        var dz = el('g', { 'class': 'pz-drizzle' }, g);
        [[-1, 0.0], [1, 0.5]].forEach(function (cfg, j) {
          var d = '', rows = 9, w = 330;
          for (var s = 0; s <= rows; s++) {
            var y = -330 + s * (660 / rows), x = (s % 2 ? w : -w) * Math.sqrt(1 - Math.pow(y / 380, 2));
            d += (s ? 'L' : 'M') + n1(x) + ' ' + n1(y);
          }
          el('path', { d: d, transform: 'rotate(' + (j ? 62 : -20) + ')', fill: 'none', stroke: '#3a2115', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'class': 'pz-dz' }, dz);
        });
      }
      rec.items.forEach(function (it) {
        var pts = scatter(r2, placed, it[1], it[2], it[3]);
        pts.forEach(function (p) {
          var outer = el('g', { transform: 'translate(' + n1(p.x) + ' ' + n1(p.y) + ') rotate(' + n1(r2() * 360) + ')' }, g);
          var inner = el('g', { 'class': 'pz-t', style: '--d:' + (k * 22 + Math.round(r2() * 60)) + 'ms' }, outer);
          var base = { mushroom: 34, jalapeno: 18, olive: 16, onion: 30, basil: 30, chili: 42, marshmallow: 22, candy: 10, pb: 46, ham: 26, greenpepper: 30 }[it[0]];
          var holder = base ? el('g', { transform: 'scale(' + (it[2] / base).toFixed(3) + ')' }, inner) : inner;
          DRAW[it[0]](holder, it[2], r2);
          k++;
        });
      });
      if (rec.flecks) {
        var f = flecks(g, r2, rec.flecks[0], rec.flecks[1], rec.flecks[2], rec.flecks[3]);
        f.setAttribute('class', 'pz-flecks pz-t');
        f.setAttribute('style', '--d:' + (k * 22 + 80) + 'ms');
      }
      pieGroups[pie.id] = g;
    });

    /* cuts */
    var cuts = el('g', { 'class': 'pz-cuts', opacity: 0 }, spin);
    var cutLines = [];
    for (i = 0; i < 4; i++) {
      var ang = i * Math.PI / 4;
      cutLines.push(el('path', { d: 'M' + n1(Math.cos(ang) * -452) + ' ' + n1(Math.sin(ang) * -452) + 'L' + n1(Math.cos(ang) * 452) + ' ' + n1(Math.sin(ang) * 452), stroke: 'rgba(110,52,16,.42)', 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, cuts));
    }

    host.appendChild(svg);

    var state = { build: -1, pie: null };
    function setBuild(p) {
      p = clamp01(p);
      if (Math.abs(p - state.build) < 0.0005) return;
      state.build = p;
      var d0 = ease(seg(p, 0, 0.2));
      var sc = 0.55 + 0.45 * back(d0);
      dough.setAttribute('transform', 'scale(' + sc.toFixed(3) + ') rotate(' + n1((1 - d0) * -40) + ')');
      dough.setAttribute('opacity', Math.min(1, d0 * 1.6).toFixed(3));
      flour.setAttribute('opacity', n1((1 - seg(p, 0.2, 0.42)) * 100) / 100);
      spiral.setAttribute('stroke-dashoffset', (1 - ease(seg(p, 0.2, 0.46))).toFixed(4));
      var cp = seg(p, 0.46, 0.72);
      gloss.setAttribute('opacity', (seg(p, 0.62, 0.74) * 0.9).toFixed(3));
      for (var i = 0; i < cheeseBlobs.length; i++) {
        var t = clamp01((cp - i / cheeseBlobs.length * 0.8) / 0.2);
        var s = t <= 0 ? 0 : back(t);
        cheeseBlobs[i].g.setAttribute('transform', 'translate(' + n1(cheeseBlobs[i].x) + ' ' + n1(cheeseBlobs[i].y) + ') scale(' + n1(s * 100) / 100 + ')');
      }
      var bk = seg(p, 0.72, 0.94);
      baked.setAttribute('opacity', n1(bk * 100) / 100);
      char.setAttribute('opacity', n1(bk * 100) / 100);
      spots.setAttribute('opacity', n1(bk * 0.9 * 100) / 100);
      var ct = seg(p, 0.9, 1);
      cuts.setAttribute('opacity', ct > 0 ? 1 : 0);
      cutLines.forEach(function (l, j) { l.setAttribute('stroke-dashoffset', (1 - clamp01(ct * 1.6 - j * 0.2)).toFixed(3)); });
      host.style.setProperty('--heat', bk.toFixed(3));
    }

    function showPie(id) {
      if (state.pie === id) return;
      state.pie = id;
      Object.keys(pieGroups).forEach(function (k) {
        pieGroups[k].classList.toggle('is-on', k === id);
      });
      var dessert = id === 'dessert';
      sauceChoc.style.opacity = dessert ? 1 : 0;
      sauceRed.style.opacity = dessert ? 0 : 1;
      herbs.style.opacity = dessert ? 0 : 1;
      cheese.classList.toggle('is-gone', dessert);
      host.classList.toggle('is-dessert', dessert);
    }

    return { setBuild: setBuild, showPie: showPie, svg: svg };
  }

  window.MMPizza = { create: create, PIES: PIES };
})();
