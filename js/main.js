/* VP Engineers — site behaviour */
(function () {
  'use strict';

  var WA = 'https://wa.me/917904132387';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);

  // ---------------------------------------------------------------------
  // Navbar: compact on scroll, mobile menu, active section
  // ---------------------------------------------------------------------
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
    var mid = window.innerHeight * 0.35, current = 0;
    sections.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= mid) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
  }

  // ---------------------------------------------------------------------
  // Reveal on scroll + counters
  // ---------------------------------------------------------------------
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    var from = parseInt(el.getAttribute('data-from') || '0', 10);
    if (reduceMotion) { el.textContent = to; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) raf(step);
    }
    raf(step);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------------------------------------------------------------------
  // Construction journey (scroll-driven)
  // ---------------------------------------------------------------------
  var STAGES = 12;
  var track = document.getElementById('journeyTrack');
  var copies = Array.prototype.slice.call(document.querySelectorAll('.jcopy'));
  var sceneExt = document.getElementById('sceneExt');
  var railSteps = document.getElementById('railSteps');
  var railFill = document.getElementById('railFill');
  var tbNum = document.getElementById('tbNum'), tbLabel = document.getElementById('tbLabel');
  var mNum = document.getElementById('railMobileNum'), mLabel = document.getElementById('railMobileLabel');

  var layers = Array.prototype.slice.call(document.querySelectorAll('.journey [data-s]')).map(function (el) {
    var u = el.getAttribute('data-u');
    return { el: el, at: parseFloat(el.getAttribute('data-s')) + parseFloat(el.getAttribute('data-t') || 0), u: u === null ? Infinity : parseFloat(u), on: false };
  });

  copies.forEach(function (c, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<span class="rail__dot"></span><span class="rail__label">' + c.getAttribute('data-label') + '</span>';
    b.setAttribute('aria-label', 'Go to stage ' + (i + 1) + ': ' + c.getAttribute('data-label'));
    b.addEventListener('click', function () { scrollToStage(i); });
    li.appendChild(b);
    railSteps.appendChild(li);
  });
  var railItems = Array.prototype.slice.call(railSteps.children);
  railSteps.parentNode.removeAttribute('aria-hidden');

  function trackMetrics() {
    var r = track.getBoundingClientRect();
    return { top: r.top + window.scrollY, len: Math.max(1, track.offsetHeight - window.innerHeight) };
  }
  function scrollToStage(i) {
    var m = trackMetrics();
    window.scrollTo({ top: m.top + m.len * ((i + 0.62) / STAGES), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  var lastStage = -1;
  function updateJourney() {
    var r = track.getBoundingClientRect();
    var len = Math.max(1, track.offsetHeight - window.innerHeight);
    var k = Math.min(1, Math.max(0, -r.top / len));
    var p = Math.min(STAGES - 0.001, k * STAGES);
    var stage = Math.floor(p);

    for (var i = 0; i < layers.length; i++) {
      var L = layers[i], on = p >= L.at && p < L.u;
      if (on !== L.on) { L.on = on; L.el.classList.toggle('on', on); }
    }
    if (sceneExt) sceneExt.classList.toggle('is-hidden', p >= 9 && p < 10);
    railFill.style.transform = 'scaleX(' + k + ')';

    if (stage !== lastStage) {
      lastStage = stage;
      copies.forEach(function (c, j) { c.classList.toggle('is-active', j === stage); c.setAttribute('aria-hidden', j === stage ? 'false' : 'true'); });
      railItems.forEach(function (li, j) { li.classList.toggle('is-done', j < stage); li.classList.toggle('is-current', j === stage); });
      var label = copies[stage].getAttribute('data-label');
      var num = (stage + 1 < 10 ? '0' : '') + (stage + 1);
      tbNum.textContent = num; tbLabel.textContent = label.toUpperCase();
      mNum.textContent = num; mLabel.textContent = label;
    }
  }

  // ---------------------------------------------------------------------
  // Scroll loop
  // ---------------------------------------------------------------------
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () { updateNav(); updateJourney(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateNav(); updateJourney();

  // ---------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------
  var grid = document.getElementById('projectGrid');
  var projects = window.VP_PROJECTS || [];
  var cats = window.VP_PROJECT_CATEGORIES || [];
  var iconIndex = { residential: 0, commercial: 1, industrial: 2, structural: 3, renovation: 4 };
  var svcIcons = document.querySelectorAll('.svc__ico');
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function catLabel(key) { for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i].label; return key; }

  if (projects.length) {
    grid.innerHTML = projects.map(function (p) {
      return '<article class="proj reveal" data-cat="' + esc(p.category) + '">' +
        '<figure class="proj__media"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async"></figure>' +
        '<div class="proj__overlay"><span class="proj__cat">' + esc(catLabel(p.category)) + '</span>' +
        '<h3 class="proj__title">' + esc(p.title) + '</h3>' +
        '<p class="proj__meta">' + esc([p.location, p.year].filter(Boolean).join(' · ')) + '</p>' +
        (p.summary ? '<p class="proj__sum">' + esc(p.summary) + '</p>' : '') + '</div></article>';
    }).join('');
  } else {
    grid.innerHTML = cats.map(function (c, i) {
      return '<article class="proj proj--empty reveal' + (i === 0 ? ' proj--wide' : '') + '" data-cat="' + c.key + '">' +
        '<div class="proj__media proj__media--bp"><span class="proj__ico"></span><span class="proj__soon">Photos coming soon</span></div>' +
        '<div class="proj__overlay"><span class="proj__cat">0' + (i + 1) + '</span>' +
        '<h3 class="proj__title">' + esc(c.label) + '</h3><p class="proj__meta">' + esc(c.text) + '</p></div></article>';
    }).join('');
    grid.querySelectorAll('.proj').forEach(function (card) {
      var ico = svcIcons[iconIndex[card.getAttribute('data-cat')]];
      if (ico) card.querySelector('.proj__ico').appendChild(ico.cloneNode(true));
    });
  }
  if (io) grid.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  else grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });

  document.getElementById('projectFilters').addEventListener('click', function (e) {
    var btn = e.target.closest('.filter');
    if (!btn) return;
    var f = btn.getAttribute('data-filter');
    this.querySelectorAll('.filter').forEach(function (b) { var on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    grid.querySelectorAll('.proj').forEach(function (card) {
      card.classList.toggle('is-hidden', f !== 'all' && card.getAttribute('data-cat') !== f);
    });
    grid.classList.toggle('is-filtered', f !== 'all');
  });

  // ---------------------------------------------------------------------
  // Enquiry form -> WhatsApp
  // ---------------------------------------------------------------------
  var form = document.getElementById('enquiryForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    if (!name) { form.elements.name.focus(); form.elements.name.setAttribute('aria-invalid', 'true'); return; }
    form.elements.name.removeAttribute('aria-invalid');
    var text = 'Hello VP Engineers,\n\nName: ' + name + '\nProject type: ' + form.elements.type.value +
      (form.elements.msg.value.trim() ? '\nDetails: ' + form.elements.msg.value.trim() : '') + '\n\n(Sent from vp-engineers website)';
    window.open(WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
