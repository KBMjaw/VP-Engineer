/*
 * VP Engineer — "From Ground to Home" construction drawing.
 *
 * Builds one SVG (1000 × 640, elevation + soil section). Each layer is a
 * <g class="jx"> with:
 *   data-s  stage index (0–12) the layer belongs to
 *   data-t  point inside that stage (0–1) at which it appears
 *   data-u  (optional) absolute progress at which it disappears again
 * Journey.tsx toggles the `.on` class from scroll progress.
 *
 * The drawing was authored on a 12-stage timeline; mapAbs() converts it to
 * the 13 stages shown on the site:
 *   0 Plot · 1 Planning · 2 Survey & marking · 3 Excavation · 4 Foundation ·
 *   5 Frame · 6 Brickwork · 7 Slab & roof · 8 Electrical & plumbing ·
 *   9 Plaster & flooring · 10 Paint & interiors · 11 Completed · 12 Handover
 */

/** Interior scene takes over from this point of stage 10. */
export const INTERIOR_FROM = 10.35;
export const STAGE_COUNT = 13;

function mapAbs(p) {
  if (p < 6) return p;                       // plot … frame unchanged
  if (p < 9) return p + 1;                   // roof, services, finishing shift by one
  if (p < 10) return INTERIOR_FROM + (p - 9) * 0.65; // interiors share stage 10
  return p + 1;                              // completed, handover
}

export function buildScene() {
  var Y = '#FFD400', INK = '#111', CON = '#b9b9b6', CON2 = '#a3a3a0';
  var GROUND = 470;
  var COLS = [300, 433, 567, 700];          // column centre lines
  var BAYS = [[308, 425], [441, 559], [575, 692]];
  var GF = [330, 455], FF = [190, 316];       // wall heights between slabs

  // -- helpers -------------------------------------------------------------
  // L(): place a layer directly on the 13-stage timeline.
  function L(s, t, cls, inner, u, extra) {
    return '<g class="jx ' + (cls || 'fade') + '" data-s="' + s + '" data-t="' + (+(t || 0)).toFixed(3) + '"' +
      (u !== undefined ? ' data-u="' + (+u).toFixed(3) + '"' : '') + (extra ? ' ' + extra : '') + '>' + inner + '</g>';
  }
  // layer(): authored on the original 12-stage timeline, remapped via mapAbs().
  function layer(s, t, cls, inner, u, extra) {
    var abs = mapAbs(s + (t || 0)), ns = Math.floor(abs + 1e-9);
    return L(ns, abs - ns, cls, inner, u !== undefined ? mapAbs(u) : undefined, extra);
  }
  function P(d, attrs) { return '<path d="' + d + '" ' + (attrs || '') + '/>'; }
  function D(d, attrs) { return '<path pathLength="1" d="' + d + '" ' + (attrs || '') + '/>'; } // drawable
  function R(x, y, w, h, attrs) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" ' + (attrs || '') + '/>'; }
  function C(cx, cy, r, attrs) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + (attrs || '') + '/>'; }
  function T(x, y, txt, attrs) { return '<text x="' + x + '" y="' + y + '" ' + (attrs || '') + '>' + txt + '</text>'; }
  function rectPath(x1, y1, x2, y2) { return 'M' + x1 + ' ' + y1 + 'H' + x2 + 'V' + y2 + 'H' + x1 + 'Z'; }

  // Wall bays with window / door openings (even-odd holes)
  var OPEN = {
    gf: [[335, 370, 400, 420], [478, 380, 522, GF[1]], [600, 370, 665, 420]],
    ff: [[330, 230, 405, 290], [460, 225, 540, 300], [595, 230, 670, 290]]
  };
  function bayPath(level) {
    var h = level === 'gf' ? GF : FF, d = '';
    BAYS.forEach(function (b, i) {
      var o = OPEN[level][i];
      d += rectPath(b[0], h[0], b[1], h[1]) + rectPath(o[0], o[1], o[2], o[3]);
    });
    return d;
  }
  function facadeHoles() {
    var d = rectPath(292, 160, 708, GROUND);
    OPEN.gf.concat(OPEN.ff).forEach(function (o) { d += rectPath(o[0], o[1], o[2], o[3]); });
    return d;
  }

  // Scale figure. opts: helmet, shirt, legs, hold ('plan'|'key'|'tape'), s (scale), dir (-1 flips), saree, kid
  function person(x, y, o) {
    o = o || {};
    var s = o.s || 1, dir = o.dir || 1, shirt = o.shirt || '#fff', legs = o.legs || '#2b2f36';
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + (s * dir) + ' ' + s + ')" class="fig">';
    if (o.saree) {
      g += P('M-8 -44 L8 -44 L11 0 L-11 0 Z', 'fill="' + o.saree + '" stroke="' + INK + '" stroke-width="1"');
      g += P('M-8 -44 L9 -20', 'stroke="' + Y + '" stroke-width="2.4" fill="none"');
    } else {
      g += P('M-4.5 0 L-2.5 -24 M4.5 0 L2.5 -24', 'stroke="' + legs + '" stroke-width="4.4" stroke-linecap="round" fill="none"');
      g += R(-7, -46, 14, 23, 'rx="4" fill="' + shirt + '" stroke="' + INK + '" stroke-width="1.1"');
    }
    g += P('M-6.5 -42 L-10 -27', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
    if (o.hold === 'plan') {
      g += P('M6.5 -42 L13 -33', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
      g += R(9, -42, 18, 12, 'fill="#dfeaf6" stroke="#2c5a8c" stroke-width="1" transform="rotate(-12 18 -36)"');
      g += P('M12 -38h10M12 -35h7', 'stroke="#2c5a8c" stroke-width=".7" transform="rotate(-12 18 -36)"');
    } else if (o.hold === 'key') {
      g += P('M6.5 -42 L19 -37', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
      g += '<g class="key-glint">' + C(23, -37, 3, 'fill="none" stroke="' + Y + '" stroke-width="1.8"') + P('M26 -37h6M30 -37v3', 'stroke="' + Y + '" stroke-width="1.8" fill="none"') + '</g>';
    } else if (o.hold === 'tape') {
      g += P('M6.5 -42 L12 -30', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
      g += R(10, -32, 6, 6, 'rx="1.5" fill="' + Y + '" stroke="' + INK + '" stroke-width=".8"');
    } else if (o.hold === 'reach') {
      g += P('M6.5 -42 L14 -50', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
    } else {
      g += P('M6.5 -42 L10 -27', 'stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" fill="none"');
    }
    g += C(0, -52, 5.5, 'fill="#7a4b2f"');
    if (o.helmet) g += P('M-7 -53 A7 7 0 0 1 7 -53 L8.5 -53 L-8.5 -53 Z', 'fill="' + o.helmet + '" stroke="' + INK + '" stroke-width=".9"');
    else if (o.saree) g += C(-4.5, -55, 3, 'fill="#1b1b1b"') + P('M-5.5 -55 A5.6 5.6 0 0 1 5.6 -53', 'stroke="#1b1b1b" stroke-width="2.4" fill="none"');
    else g += P('M-5.6 -53 A5.6 5.6 0 0 1 5.6 -53', 'stroke="#1b1b1b" stroke-width="2.6" fill="none"');
    return g + '</g>';
  }

  function tree(x, r, fill, stroke) {
    return '<g class="tree">' + P('M' + x + ' ' + GROUND + 'V' + (GROUND - r * 1.5), 'stroke="' + (stroke || '#8a8f86') + '" stroke-width="2"') +
      C(x, GROUND - r * 1.9, r, 'fill="' + (fill || '#f4f6f1') + '" stroke="' + (stroke || '#8a8f86') + '" stroke-width="1.2"') +
      C(x - r * .45, GROUND - r * 1.6, r * .62, 'fill="' + (fill || '#f4f6f1') + '" stroke="' + (stroke || '#8a8f86') + '" stroke-width="1.2"') + '</g>';
  }
  function shrub(x, w, c) {
    return P('M' + (x - w) + ' ' + GROUND + 'q0 -' + w * .9 + ' ' + w * .6 + ' -' + w * .9 + 'q' + w * .4 + ' -' + w * .5 + ' ' + w * .8 + ' 0q' + w * .6 + ' 0 ' + w * .6 + ' ' + w * .9 + 'Z',
      'fill="' + (c || '#6f8f55') + '" stroke="#3f5a33" stroke-width=".8"');
  }
  function card(x, y, w, h, title, inner) {
    return '<g class="inset">' + R(x, y, w, h, 'fill="#fff" stroke="' + INK + '" stroke-width="1"') +
      R(x, y, w, 20, 'fill="' + INK + '"') + R(x, y, 6, 20, 'fill="' + Y + '"') +
      T(x + 14, y + 14, title, 'class="sv-mono" fill="#fff"') + inner + '</g>';
  }
  function tag(x, y, txt, anchor) {
    return '<g class="tag">' + T(x, y, txt, 'class="sv-tag" text-anchor="' + (anchor || 'start') + '"') + '</g>';
  }

  var svg = '';

  // -- defs ---------------------------------------------------------------
  svg += '<defs>' +
    '<pattern id="sGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#eef1f5" stroke-width="1"/></pattern>' +
    '<pattern id="sGrid5" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#e2e7ee" stroke-width="1"/></pattern>' +
    '<pattern id="soil" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#efe7da"/><circle cx="3" cy="4" r=".9" fill="#c9b79a"/><circle cx="10" cy="10" r=".7" fill="#c9b79a"/><path d="M0 14L14 0" stroke="#e3d6c1" stroke-width=".6"/></pattern>' +
    '<pattern id="brick" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="#f0dfcf"/><path d="M0 7.5H16M8 0V3.5M0 3.5H16M0 4V7.5M16 4V7.5" stroke="#cfae90" stroke-width=".8"/></pattern>' +
    '<pattern id="tiles" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#f2efe9"/><path d="M22 0H0V22" fill="none" stroke="#d9d3c8" stroke-width="1"/></pattern>' +
    '<pattern id="wood" width="10" height="40" patternUnits="userSpaceOnUse"><rect width="10" height="40" fill="#8a5a3a"/><path d="M0 0V40" stroke="#6d4329" stroke-width="1.4"/><path d="M5 6v8M3 24v9" stroke="#9d6b48" stroke-width=".8"/></pattern>' +
    '<pattern id="slats" width="8" height="40" patternUnits="userSpaceOnUse"><rect width="8" height="40" fill="#a0704c"/><path d="M0 0V40" stroke="#5e3a22" stroke-width="1.6"/></pattern>' +
    '<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2231"/><stop offset=".55" stop-color="#3b3a52"/><stop offset=".85" stop-color="#c9825a"/><stop offset="1" stop-color="#f1b46b"/></linearGradient>' +
    '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7a3"/><stop offset="1" stop-color="#f3b94f"/></linearGradient>' +
    '<linearGradient id="tv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b3340"/><stop offset=".5" stop-color="#0d0f13"/><stop offset="1" stop-color="#1d222b"/></linearGradient>' +
    '<radialGradient id="glow"><stop offset="0" stop-color="#ffd76a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>' +
    '<marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="#111" stroke-width="1.4"/></marker>' +
    '</defs>';

  // ======================================================================
  // EXTERIOR SCENE (stages 0–8, 10–11)
  // ======================================================================
  var ext = '';

  // Sky + drawing grid
  ext += R(0, 0, 1000, GROUND, 'fill="#fff"') + R(0, 0, 1000, GROUND, 'fill="url(#sGrid)"') + R(0, 0, 1000, GROUND, 'fill="url(#sGrid5)"');
  // Dusk sky for completed home
  ext += layer(10, 0, 'fade slow', R(0, 0, 1000, GROUND, 'fill="url(#dusk)"') +
    C(90, 60, 1.2, 'fill="#fff"') + C(180, 34, 1, 'fill="#fff"') + C(260, 80, .9, 'fill="#fff"') + C(760, 40, 1.1, 'fill="#fff"') + C(930, 90, .9, 'fill="#fff"') + C(560, 26, 1, 'fill="#fff"'));
  // Distant hills / town
  ext += P('M0 ' + GROUND + 'V442Q120 412 240 436T480 430T760 424T1000 440V' + GROUND + 'Z', 'class="hills" fill="#f1f2f3" stroke="#d6d9dd" stroke-width="1"');
  // Background trees
  ext += tree(64, 26) + tree(948, 30);
  // Soil section
  ext += R(0, GROUND, 1000, 170, 'fill="url(#soil)"');
  ext += R(0, GROUND, 1000, 8, 'fill="#d8c6a6"');
  ext += P('M0 ' + GROUND + 'H1000', 'stroke="' + INK + '" stroke-width="1.6"');
  ext += T(16, 628, 'SECTION THROUGH SITE', 'class="sv-mono sv-mono--muted"');

  // --- Stage 0: empty land --------------------------------------------
  // plot boundary pegs + tape
  ext += layer(0, 0, 'fade',
    P('M262 ' + GROUND + 'v-26M738 ' + GROUND + 'v-26', 'stroke="' + INK + '" stroke-width="3"') +
    P('M262 448H738', 'stroke="' + Y + '" stroke-width="2" stroke-dasharray="10 6"') +
    T(500, 440, 'PLOT BOUNDARY', 'class="sv-tag" text-anchor="middle"'), 2.6);
  // grass tufts
  var tufts = '';
  [120, 210, 330, 420, 610, 690, 820, 880].forEach(function (x) { tufts += P('M' + x + ' ' + GROUND + 'l-3 -7M' + x + ' ' + GROUND + 'l0 -9M' + x + ' ' + GROUND + 'l3 -7', 'stroke="#7d9566" stroke-width="1.2" fill="none"'); });
  ext += layer(0, 0, 'fade', tufts, 3);
  // engineer inspecting
  ext += layer(0, .15, 'fade slide', person(520, GROUND, { helmet: Y, shirt: '#fff', hold: 'reach' }), 1);

  // --- Stage 1: survey & planning -------------------------------------
  // theodolite tripod
  ext += layer(1, 0, 'fade draw',
    '<g fill="none" stroke="' + INK + '" stroke-width="1.6">' + D('M372 ' + GROUND + 'L384 418L396 ' + GROUND) + D('M384 418V' + GROUND) + '</g>' +
    R(377, 406, 14, 12, 'rx="2" fill="' + Y + '" stroke="' + INK + '"') + R(380, 400, 8, 6, 'fill="' + INK + '"'), 3);
  // ranging staff + sight line
  ext += layer(1, .2, 'fade draw',
    R(716, 380, 6, 90, 'fill="#fff" stroke="' + INK + '"') + R(716, 380, 6, 15, 'fill="#e23b3b"') + R(716, 410, 6, 15, 'fill="#e23b3b"') + R(716, 440, 6, 15, 'fill="#e23b3b"') +
    D('M392 410L716 400', 'fill="none" stroke="#e23b3b" stroke-width="1"'), 3);
  // engineer with blueprint
  ext += layer(1, .1, 'fade slide', person(560, GROUND, { helmet: Y, shirt: '#fff', hold: 'plan' }), 3.4);
  // dimension line
  ext += layer(1, .35, 'draw',
    D('M262 494H738', 'stroke="' + INK + '" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)" fill="none"') +
    D('M262 482v20M738 482v20', 'stroke="' + INK + '" stroke-width="1" fill="none"'), 3.2);
  ext += layer(1, .45, 'fade', R(470, 486, 60, 15, 'fill="#efe7da"') + T(500, 498, 'PLOT WIDTH', 'class="sv-tag" text-anchor="middle"'), 3.2);

  // Layout plan inset (stages 1–3)
  var pg = '';
  var gx = [740, 800, 860, 920], gy = [76, 130, 184];
  pg += R(724, 62, 212, 136, 'fill="none" stroke="#999" stroke-dasharray="4 3"');
  var gridLines = '';
  gx.forEach(function (x) { gridLines += D('M' + x + ' 56V204', 'stroke="#2c5a8c" stroke-width=".8"  fill="none"'); });
  gy.forEach(function (y) { gridLines += D('M716 ' + y + 'H944', 'stroke="#2c5a8c" stroke-width=".8"  fill="none"'); });
  var bubbles = '';
  ['A', 'B', 'C', 'D'].forEach(function (l, i) { bubbles += C(gx[i], 212, 6, 'fill="#fff" stroke="#2c5a8c"') + T(gx[i], 215, l, 'class="sv-bub" text-anchor="middle"'); });
  var foots = '';
  gx.forEach(function (x, i) { gy.forEach(function (y, j) {
    foots += R(x - 9, y - 9, 18, 18, 'fill="#fff6c4" stroke="' + INK + '" stroke-width="1" class="pop-i" style="transition-delay:' + ((i * 3 + j) * 40) + 'ms"');
  }); });
  var inset1 = card(700, 24, 260, 210, 'SITE LAYOUT — PLAN',
    layer(1, .25, 'fade', pg) + layer(1, .4, 'draw', gridLines) + layer(1, .6, 'fade', bubbles) +
    layer(2, .15, 'stagger', foots) + layer(2, .5, 'fade', T(830, 228, 'FOOTING POSITIONS MARKED', 'class="sv-tag" text-anchor="middle"')));
  ext += layer(1, .2, 'fade pop', inset1, 3.9);

  // --- Stage 2: site marking ------------------------------------------
  var marks = '', pegs = '';
  COLS.forEach(function (x) {
    marks += D('M' + (x - 45) + ' 474H' + (x + 45), 'stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"');
    marks += D('M' + x + ' 471V477', 'stroke="#fff" stroke-width="2" fill="none"');
    pegs += P('M' + (x - 45) + ' ' + GROUND + 'v-12M' + (x + 45) + ' ' + GROUND + 'v-12', 'stroke="#6b4a2a" stroke-width="2.4"');
  });
  ext += layer(2, .05, 'draw', marks, 3.3);
  ext += layer(2, .25, 'fade', pegs + P('M240 461H760', 'stroke="#fff" stroke-width="1" stroke-dasharray="2 2"') + P('M240 461H760', 'stroke="' + INK + '" stroke-width=".4"'), 3.6);
  ext += layer(2, .4, 'fade slide', person(640, GROUND, { helmet: Y, shirt: '#fff', hold: 'tape' }) + P('M652 440 L700 466', 'stroke="' + Y + '" stroke-width="1.5"'), 3.4);
  ext += layer(2, .5, 'fade', tag(500, 456, 'LIME MARKING · CENTRE LINES', 'middle'), 3.2);

  // --- Stage 3: excavation --------------------------------------------
  var pits = '';
  COLS.forEach(function (x, i) {
    pits += '<g class="jx drop" data-s="3" data-t="' + (.1 + i * .12) + '">' +
      R(x - 45, GROUND, 90, 120, 'fill="#fbf8f3" stroke="' + INK + '" stroke-width="1" stroke-dasharray="5 3"') + '</g>';
  });
  ext += pits;
  // excavator
  var exc =
    '<g class="excavator">' +
    R(110, 452, 112, 18, 'rx="9" fill="#2a2a2a"') + C(122, 461, 5, 'fill="#555"') + C(210, 461, 5, 'fill="#555"') + C(166, 461, 5, 'fill="#555"') +
    R(118, 418, 84, 34, 'rx="3" fill="' + Y + '" stroke="' + INK + '"') +
    P('M150 418V384H188L198 418Z', 'fill="' + Y + '" stroke="' + INK + '"') +
    P('M156 390H184L191 414H156Z', 'fill="#cfe3f2" stroke="' + INK + '" stroke-width=".8"') +
    R(104, 424, 16, 24, 'fill="#333"') +
    '<g class="exc-arm">' +
    P('M200 428L262 380L300 404', 'fill="none" stroke="' + Y + '" stroke-width="9" stroke-linejoin="round"') +
    P('M200 428L262 380L300 404', 'fill="none" stroke="' + INK + '" stroke-width="1" stroke-linejoin="round"') +
    '<g class="exc-stick">' + P('M300 404L318 452', 'stroke="' + Y + '" stroke-width="7" stroke-linecap="round"') +
    P('M310 446L330 452L322 472L304 466Z', 'fill="#333" stroke="' + INK + '"') + '</g>' +
    '</g></g>';
  ext += layer(3, 0, 'fade slide', exc, 4.6);
  // spoil heap
  ext += layer(3, .3, 'rise', P('M30 ' + GROUND + 'Q60 420 98 ' + GROUND + 'Z', 'fill="#c9ad86" stroke="#8a6f4d"'), 6.3);
  // workers
  ext += layer(3, .35, 'fade', person(445, GROUND, { helmet: Y, shirt: '#3a4a5c' }) + person(600, GROUND, { helmet: '#fff', shirt: '#fff', hold: 'plan', dir: -1 }), 4.9);
  ext += layer(3, .45, 'fade pop',
    '<g transform="translate(500 548)">' + R(-78, -16, 156, 32, 'rx="16" fill="' + INK + '"') + T(0, 6, 'குழி வெட்டுதல்', 'class="sv-ta" text-anchor="middle"') + '</g>', 4.4);
  ext += layer(3, .55, 'draw', D('M745 470V590', 'stroke="' + INK + '" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)" fill="none"') +
    T(754, 534, 'DEPTH', 'class="sv-tag"'), 4.8);

  // --- Stage 4: foundation --------------------------------------------
  var pcc = '', rebar = '', footO = '', footF = '', ped = '';
  COLS.forEach(function (x) {
    pcc += R(x - 42, 578, 84, 12, 'fill="#cfcfcb" stroke="' + INK + '" stroke-width=".8"');
    rebar += P('M' + (x - 36) + ' 572H' + (x + 36), 'stroke="#7b3f1d" stroke-width="1.6"');
    for (var k = -32; k <= 32; k += 8) rebar += C(x + k, 568, 1.4, 'fill="#7b3f1d"');
    rebar += P('M' + (x - 5) + ' 572V492M' + (x + 5) + ' 572V492', 'stroke="#7b3f1d" stroke-width="1.6"');
    var fp = 'M' + (x - 38) + ' 578L' + (x + 38) + ' 578L' + (x + 38) + ' 564L' + (x + 12) + ' 550L' + (x - 12) + ' 550L' + (x - 38) + ' 564Z';
    footO += D(fp, 'fill="none" stroke="' + INK + '" stroke-width="1.4"');
    footF += P(fp, 'fill="' + CON + '"');
    ped += R(x - 9, GROUND - 1, 18, 552 - GROUND, 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1"');
  });
  ext += layer(4, 0, 'fade', pcc) + layer(4, .2, 'fade', rebar) + layer(4, .4, 'draw', footO) + layer(4, .6, 'fade', footF + ped);
  // backfill (pits filled back with soil around pedestals)
  var backfill = '';
  COLS.forEach(function (x) {
    var fp = 'M' + (x - 38) + ' 578L' + (x + 38) + ' 578L' + (x + 38) + ' 564L' + (x + 12) + ' 550L' + (x - 12) + ' 550L' + (x - 38) + ' 564Z';
    backfill += R(x - 45, GROUND, 90, 120, 'fill="url(#soil)"') + R(x - 42, 578, 84, 12, 'fill="#cfcfcb" stroke="' + INK + '" stroke-width=".8"') +
      P(fp, 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1.4"') + R(x - 9, GROUND - 1, 18, 552 - GROUND, 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1"') +
      P('M' + (x - 45) + ' ' + GROUND + 'V590H' + (x + 45) + 'V' + GROUND, 'fill="none" stroke="#c9b79a" stroke-dasharray="3 3"');
  });
  ext += layer(4, .78, 'fade', backfill);
  // plinth beam / foundation walls
  ext += layer(4, .85, 'wipe-x', R(292, 455, 416, 16, 'fill="' + CON2 + '" stroke="' + INK + '" stroke-width="1"'));
  ext += layer(4, .3, 'fade', tag(712, 600, 'PCC · FOOTING · PEDESTAL'), 5);

  // --- Stage 5: structure ---------------------------------------------
  // crane (behind building)
  var crane = '<g class="crane">' +
    '<g fill="none" stroke="' + INK + '" stroke-width="1">' +
    R(840, 96, 16, 374, 'fill="' + Y + '"') + P('M840 470' + (function () { var s = ''; for (var y = 470; y > 100; y -= 16) s += 'L856 ' + (y - 8) + 'L840 ' + (y - 16); return s; })()) +
    P('M848 96V58M848 58L612 92M848 58L960 92') +
    R(612, 92, 348, 10, 'fill="' + Y + '"') + P('M612 102' + (function () { var s = ''; for (var x = 612; x < 960; x += 14) s += 'L' + (x + 7) + ' 92L' + (x + 14) + ' 102'; return s; })()) +
    R(930, 102, 30, 22, 'fill="#3a3a3a"') + R(856, 102, 18, 14, 'fill="#cfe3f2"') +
    '</g>' +
    '<g class="crane-trolley">' + R(664, 102, 14, 6, 'fill="' + INK + '"') +
    '<g class="crane-hook">' + P('M671 108V230', 'stroke="' + INK + '" stroke-width="1"') +
    P('M666 230h10l-5 8z', 'fill="' + INK + '"') + R(646, 238, 50, 9, 'fill="#7b3f1d"') + P('M646 242H696', 'stroke="#5a2c12" stroke-width=".8"') + '</g></g>' +
    '</g>';
  ext += layer(5, 0, 'fade rise-sm', crane, 7.6);

  // GF columns
  COLS.forEach(function (x, i) {
    ext += layer(5, .02 + i * .04, 'rise', R(x - 8, GF[0], 16, GF[1] - GF[0], 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1"'));
  });
  // first floor slab + beam
  ext += layer(5, .28, 'wipe-x', R(292, 316, 416, 14, 'fill="' + CON2 + '" stroke="' + INK + '" stroke-width="1"'));
  // GF walls
  ext += L(6, .05, 'rise', P(bayPath('gf'), 'fill="url(#brick)" fill-rule="evenodd" stroke="' + INK + '" stroke-width=".8"'));
  // lintels
  ext += L(6, .2, 'fade', R(330, 362, 75, 6, 'fill="' + CON + '"') + R(595, 362, 75, 6, 'fill="' + CON + '"') + R(474, 372, 52, 6, 'fill="' + CON + '"'));
  // FF columns
  COLS.forEach(function (x, i) {
    ext += layer(5, .56 + i * .04, 'rise', R(x - 8, FF[0], 16, FF[1] - FF[0], 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1"'));
  });
  // FF walls
  ext += L(6, .45, 'rise', P(bayPath('ff'), 'fill="url(#brick)" fill-rule="evenodd" stroke="' + INK + '" stroke-width=".8"'));
  // scaffolding
  var sc = '<g stroke="#7d7d7d" stroke-width="1.3" fill="none">';
  [[262, 280], [720, 738]].forEach(function (p) {
    sc += P('M' + p[0] + ' ' + GROUND + 'V150M' + p[1] + ' ' + GROUND + 'V150');
    for (var y = 430; y > 150; y -= 40) sc += P('M' + (p[0] - 4) + ' ' + y + 'H' + (p[1] + 4)) + P('M' + p[0] + ' ' + (y + 40) + 'L' + p[1] + ' ' + y, 'stroke-width=".8"');
    sc += P('M' + (p[0] - 6) + ' ' + GROUND + 'H' + (p[1] + 6), 'stroke-width="3"');
  });
  sc += '</g>';
  ext += layer(5, .6, 'fade', sc, 8.75);
  ext += layer(5, .35, 'fade', person(380, 316, { helmet: Y, shirt: '#3a4a5c', s: .8 }) + person(620, 316, { helmet: '#fff', shirt: '#fff', s: .8, hold: 'plan', dir: -1 }), 6.5);
  ext += layer(5, .05, 'fade', person(220, GROUND, { helmet: Y, shirt: '#58606b', hold: 'reach' }), 6.8);

  // --- Stage 6: roof & concrete ---------------------------------------
  var mesh = P('M292 181H708M292 186H708', 'stroke="#7b3f1d" stroke-width="1.4"');
  for (var mx = 296; mx <= 704; mx += 12) mesh += P('M' + mx + ' 177V190', 'stroke="#7b3f1d" stroke-width="1"');
  ext += layer(6, 0, 'wipe-x', P('M286 190H714', 'stroke="#8a6f4d" stroke-width="3"') + mesh);
  ext += layer(6, .35, 'wipe-x slower', R(292, 176, 416, 14, 'fill="' + CON2 + '" stroke="' + INK + '" stroke-width="1"'));
  ext += layer(6, .8, 'rise', R(292, 160, 416, 16, 'fill="' + CON + '" stroke="' + INK + '" stroke-width="1"'));
  // mixer truck + pump line
  var truck = '<g class="truck">' +
    R(40, 440, 190, 12, 'fill="#2b2b2b"') + C(70, 458, 12, 'fill="#222"') + C(150, 458, 12, 'fill="#222"') + C(205, 458, 12, 'fill="#222"') +
    C(70, 458, 4, 'fill="#999"') + C(150, 458, 4, 'fill="#999"') + C(205, 458, 4, 'fill="#999"') +
    P('M190 440V404H222L232 424V440Z', 'fill="' + Y + '" stroke="' + INK + '"') + P('M196 410H218L224 424H196Z', 'fill="#cfe3f2"') +
    '<g class="drum">' + P('M50 432L66 396Q120 378 176 400L184 432Z', 'fill="#e8e8e6" stroke="' + INK + '"') +
    '<g class="drum-stripes">' + P('M70 430L96 392M100 430L126 388M130 430L156 392M160 430L180 404', 'stroke="' + Y + '" stroke-width="5"') + '</g></g>' +
    '</g>';
  ext += layer(6, 0, 'fade slide', truck, 7.4);
  ext += layer(6, .2, 'draw', D('M186 402L250 140L420 170', 'fill="none" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"') +
    '', 7.2);
  ext += layer(6, .4, 'fade', P('M186 402L250 140L420 170', 'fill="none" stroke="#9a9a9a" stroke-width="3" stroke-linejoin="round" class="pump-flow"'), 7.2);
  ext += layer(6, .3, 'fade', person(470, 176, { helmet: Y, shirt: '#3a4a5c', s: .8 }) + person(560, 176, { helmet: Y, shirt: '#58606b', s: .8, dir: -1 }), 7.2);
  ext += layer(6, .4, 'fade', tag(712, 172, 'ROOF SLAB · CONCRETE POUR'), 7);

  // --- Stage 7: electrical & plumbing ---------------------------------
  var elec = 'M300 338H700' +
    'M425 338V400H412M465 338V372M580 338V398H592' +
    'M300 196H700M425 196V262H412M575 196V256H588M488 196V222';
  var boxes = R(402, 394, 10, 13, 'fill="#fff" stroke="' + INK + '"') + R(460, 372, 10, 13, 'fill="#fff" stroke="' + INK + '"') +
    R(590, 392, 10, 13, 'fill="#fff" stroke="' + INK + '"') + R(402, 256, 10, 13, 'fill="#fff" stroke="' + INK + '"') +
    R(586, 250, 10, 13, 'fill="#fff" stroke="' + INK + '"') + R(676, 344, 18, 26, 'fill="' + INK + '"') + R(679, 348, 12, 3, 'fill="' + Y + '"');
  ext += layer(7, .05, 'draw', D(elec, 'fill="none" stroke="#d4a900" stroke-width="2.6" stroke-linejoin="round"'), 8.35);
  ext += layer(7, .4, 'fade', P(elec, 'fill="none" stroke="' + Y + '" stroke-width="2.6" class="flow"') + boxes, 8.35);
  var water = 'M684 176V' + GROUND + 'M684 262H650M684 404H640M684 ' + GROUND + 'V500H880';
  ext += layer(7, .45, 'draw', D(water, 'fill="none" stroke="#2f6db3" stroke-width="3" stroke-linejoin="round"'), 8.35);
  ext += layer(7, .7, 'fade', P(water, 'fill="none" stroke="#8cc3ff" stroke-width="1.6" class="flow flow--water"'), 8.35);
  // overhead tank + sump
  ext += layer(7, .5, 'rise', R(636, 128, 46, 32, 'rx="4" fill="#2b2b2b"') + P('M636 138H682', 'stroke="#555"') + P('M659 160V176', 'stroke="#2f6db3" stroke-width="3"'));
  ext += layer(7, .75, 'fade', R(870, 492, 70, 50, 'fill="#e4eef8" stroke="#2f6db3"') + T(905, 522, 'SUMP', 'class="sv-tag" text-anchor="middle"'));
  ext += layer(7, .3, 'fade', tag(296, 152, '— ELECTRICAL CONDUITS') + '<g class="tag">' + T(296, 140, '— WATER LINES', 'class="sv-tag" fill="#2f6db3"') + '</g>', 8.35);

  // --- Stage 8: tiles & finishing -------------------------------------
  ext += layer(8, .05, 'rise slower', P(facadeHoles(), 'fill="#f7f5f0" fill-rule="evenodd" stroke="' + INK + '" stroke-width="1"'));
  ext += layer(8, .35, 'fade', P('M292 330H708M292 190H708', 'stroke="#d6d1c7" stroke-width="1"') + R(292, 160, 416, 10, 'fill="#2a2a2a"') + R(286, 455, 428, 15, 'fill="#3b3b3b"'));
  // paint: charcoal panel around centre FF bay, warm grey GF bay 1
  ext += L(10, 0, 'wipe-x', P(rectPath(441, 190, 559, 316) + rectPath(460, 225, 540, 300), 'fill="#2b2b2b" fill-rule="evenodd"') +
    P(rectPath(308, 330, 425, 455) + rectPath(335, 370, 400, 420), 'fill="#e6e0d6" fill-rule="evenodd"'));
  // window + door frames
  var frames = '';
  OPEN.gf.concat(OPEN.ff).forEach(function (o) { frames += R(o[0], o[1], o[2] - o[0], o[3] - o[1], 'fill="none" stroke="' + INK + '" stroke-width="2.4"'); });
  frames += P('M367.5 370V420M632.5 370V420M367.5 230V290M632.5 230V290M500 225V300', 'stroke="' + INK + '" stroke-width="1.4"');
  ext += L(10, .15, 'fade', frames);
  // finishes inset
  var tilesG = '';
  for (var ti = 0; ti < 6; ti++) for (var tj = 0; tj < 3; tj++)
    tilesG += R(716 + ti * 22, 54 + tj * 22, 20, 20, 'fill="' + ((ti + tj) % 2 ? '#ece6dc' : '#f7f3ec') + '" stroke="#bdb5a7" class="pop-i" style="transition-delay:' + ((ti + tj * 6) * 35) + 'ms"');
  var swatches = C(884, 66, 9, 'fill="#f7f5f0" stroke="' + INK + '"') + C(910, 66, 9, 'fill="#e6e0d6" stroke="' + INK + '"') + C(936, 66, 9, 'fill="#2b2b2b" stroke="' + INK + '"') +
    T(910, 92, 'PAINT', 'class="sv-tag" text-anchor="middle"');
  var inset2 = card(700, 24, 260, 140, 'FINISHES',
    layer(8, .2, 'stagger', tilesG) + layer(8, .45, 'fade', swatches) +
    layer(8, .55, 'fade', T(716, 136, 'PLASTER · PUTTY · TILES · PAINT', 'class="sv-tag"')));
  ext += layer(8, .1, 'fade pop', inset2, 9);

  // --- Stage 10: completed home ---------------------------------------
  var glass = '';
  OPEN.gf.concat(OPEN.ff).forEach(function (o, i) {
    if (i === 1) {
      glass += R(o[0], o[1], o[2] - o[0], o[3] - o[1], 'fill="url(#slats)"') + C(512, 420, 1.8, 'fill="' + Y + '"');
    } else glass += R(o[0], o[1], o[2] - o[0], o[3] - o[1], 'fill="url(#glass)" class="win"');
  });
  ext += layer(10, .1, 'fade', glass + frames);
  ext += layer(10, .2, 'fade', P(rectPath(441, 190, 559, 316) + rectPath(460, 225, 540, 300), 'fill="url(#wood)" fill-rule="evenodd"') + R(460, 225, 80, 75, 'fill="none" stroke="' + INK + '" stroke-width="2.4"') + P('M500 225V300', 'stroke="' + INK + '" stroke-width="1.4"'));
  ext += layer(10, .3, 'fade', P('M436 300H564M436 316H564', 'stroke="' + INK + '" stroke-width="1.6"') + R(436, 300, 128, 16, 'fill="#bfe0f2" opacity=".45"'));
  // compound wall + gate + driveway
  var cw = R(104, 436, 186, 34, 'fill="#ece8e0" stroke="' + INK + '"') + R(710, 436, 70, 34, 'fill="#ece8e0" stroke="' + INK + '"') +
    R(98, 428, 14, 42, 'fill="#3b3b3b"') + R(278, 428, 14, 42, 'fill="#3b3b3b"') + R(710, 428, 14, 42, 'fill="#3b3b3b"') + R(886, 428, 14, 42, 'fill="#3b3b3b"');
  var gate = '<g stroke="' + INK + '" stroke-width="2">' + P('M780 440H886M780 466H886') + (function () { var s = ''; for (var x = 786; x < 886; x += 8) s += P('M' + x + ' 440V470'); return s; })() + '</g>';
  ext += layer(10, .35, 'rise', cw + gate);
  ext += layer(10, .45, 'wipe-x', R(0, GROUND, 1000, 8, 'fill="#bdb6aa"') + P('M0 ' + GROUND + 'H1000', 'stroke="' + INK + '" stroke-width="1.6"'));
  // landscaping
  ext += layer(10, .55, 'rise', shrub(130, 14) + shrub(160, 12, '#7f9f60') + shrub(250, 16) + shrub(740, 13, '#7f9f60') + shrub(320, 12) + shrub(680, 12) +
    tree(46, 28, '#6f8f55', '#3f5a33') + tree(960, 32, '#7f9f60', '#3f5a33') +
    R(600, 296, 12, 20, 'fill="#3b3b3b"') + C(606, 292, 9, 'fill="#6f8f55"') + R(388, 296, 12, 20, 'fill="#3b3b3b"') + C(394, 292, 9, 'fill="#6f8f55"'));
  // lights
  var lights = '<g class="lights">' +
    C(433, 398, 26, 'fill="url(#glow)"') + C(567, 398, 26, 'fill="url(#glow)"') + C(105, 422, 22, 'fill="url(#glow)"') + C(285, 422, 22, 'fill="url(#glow)"') +
    C(717, 422, 22, 'fill="url(#glow)"') + C(893, 422, 22, 'fill="url(#glow)"') + R(300, 170, 400, 3, 'fill="' + Y + '" opacity=".9"') +
    R(429, 392, 8, 12, 'fill="' + Y + '"') + R(563, 392, 8, 12, 'fill="' + Y + '"') +
    C(105, 424, 4, 'fill="' + Y + '"') + C(285, 424, 4, 'fill="' + Y + '"') + C(717, 424, 4, 'fill="' + Y + '"') + C(893, 424, 4, 'fill="' + Y + '"') + '</g>';
  ext += layer(10, .7, 'fade', lights);
  ext += layer(10, .8, 'fade', tag(500, 150, 'YOUR HOME — COMPLETED', 'middle'), 11);

  // --- Stage 11: key handover & housewarming --------------------------
  // mango-leaf thoranam over the door
  var thoranam = P('M470 378Q500 390 530 378', 'stroke="#3f5a33" stroke-width="1.6" fill="none"');
  for (var lx = 474; lx <= 526; lx += 6.5) {
    var ly = 378 + 12 * (1 - Math.pow((lx - 500) / 30, 2)) * .5;
    thoranam += P('M' + lx + ' ' + ly + 'q-2 6 0 12q2 -6 0 -12', 'fill="#4e7a36" stroke="#2f4a22" stroke-width=".5"');
  }
  ext += layer(11, .2, 'fade', thoranam);
  // banana plants at gate pillars (traditional housewarming)
  function banana(x, d) {
    return '<g>' + P('M' + x + ' ' + GROUND + 'V410', 'stroke="#5d7d3a" stroke-width="4"') +
      P('M' + x + ' 414q' + (18 * d) + ' -14 ' + (30 * d) + ' -4q' + (-14 * d) + ' 4 ' + (-30 * d) + ' 4z', 'fill="#6f9a45" stroke="#3f5a33" stroke-width=".6"') +
      P('M' + x + ' 412q' + (-16 * d) + ' -18 ' + (-28 * d) + ' -10q' + (14 * d) + ' 2 ' + (28 * d) + ' 10z', 'fill="#7fad52" stroke="#3f5a33" stroke-width=".6"') +
      P('M' + x + ' 410q' + (4 * d) + ' -22 ' + (14 * d) + ' -28q' + (-4 * d) + ' 14 ' + (-14 * d) + ' 28z', 'fill="#6f9a45" stroke="#3f5a33" stroke-width=".6"') + '</g>';
  }
  ext += layer(11, .3, 'rise', banana(770, -1) + banana(896, 1));
  // kuthu vilakku lamps either side of the door
  function lamp(x) {
    return '<g>' + P('M' + (x - 6) + ' ' + GROUND + 'H' + (x + 6) + 'L' + (x + 2) + ' 450H' + (x - 2) + 'Z', 'fill="#d9a520" stroke="#8a6410" stroke-width=".6"') +
      P('M' + x + ' 450V440', 'stroke="#d9a520" stroke-width="2"') + P('M' + (x - 6) + ' 440H' + (x + 6), 'stroke="#d9a520" stroke-width="2.4"') +
      '<g class="flame">' + C(x, 432, 7, 'fill="url(#glow)"') + P('M' + x + ' 428q-3 6 0 8q3 -2 0 -8z', 'fill="#ffb627"') + '</g></g>';
  }
  ext += layer(11, .35, 'fade', lamp(468) + lamp(532));
  // engineer handing over the key to the family
  ext += layer(11, .05, 'fade slide',
    person(560, GROUND, { shirt: '#fff', legs: '#e9e4d8', hold: 'key' }) );
  ext += layer(11, .1, 'fade',
    person(612, GROUND, { shirt: '#f2efe6', legs: '#f5f2ea', dir: -1, hold: 'reach' }) +
    person(636, GROUND, { saree: '#a3263a', dir: -1 }) +
    person(660, GROUND, { shirt: Y, legs: '#2b2f36', s: .62, dir: -1 }) +
    person(680, GROUND, { saree: '#2f6b4f', s: .66, dir: -1 }));
  ext += layer(11, .5, 'fade', '<g class="hearts">' + T(598, 398, '✦', 'class="sv-spark"') + T(642, 388, '✦', 'class="sv-spark"') + T(620, 372, '✦', 'class="sv-spark"') + '</g>');

  svg += '<g id="sceneExt">' + ext + '</g>';

  // ======================================================================
  // INTERIOR SCENE (stage 9)
  // ======================================================================
  var int = '';
  int += R(0, 0, 1000, 640, 'fill="#fbfaf7"');
  int += R(60, 70, 880, 440, 'fill="#f4efe6"') + P('M60 70H940', 'stroke="' + INK + '" stroke-width="2"');
  int += R(40, 510, 920, 30, 'fill="url(#tiles)" stroke="' + INK + '"') + P('M40 510H960', 'stroke="' + INK + '" stroke-width="2"');
  int += R(40, 540, 920, 100, 'fill="#ece8e0"') + T(16, 628, 'SECTION THROUGH HOME', 'class="sv-mono sv-mono--muted"');
  int += R(352, 70, 12, 440, 'fill="#e2dccf" stroke="' + INK + '"') + R(680, 70, 12, 440, 'fill="#e2dccf" stroke="' + INK + '"');
  int += R(40, 50, 12, 490, 'fill="' + CON + '" stroke="' + INK + '"') + R(948, 50, 12, 490, 'fill="' + CON + '" stroke="' + INK + '"') + R(40, 50, 920, 20, 'fill="' + CON2 + '" stroke="' + INK + '"');

  // kitchen
  var kit = R(90, 300, 250, 124, 'fill="url(#tiles)" opacity=".8"') +
    R(86, 424, 258, 9, 'fill="#2b2b2b"') + R(90, 433, 250, 77, 'fill="#fff" stroke="' + INK + '"') +
    P('M152 433V510M215 433V510M278 433V510', 'stroke="' + INK + '" stroke-width=".8"') +
    P('M140 470V482M162 470V482M265 470V482M290 470V482', 'stroke="' + INK + '" stroke-width="2"') +
    R(90, 160, 250, 80, 'fill="#2b2b2b" stroke="' + INK + '"') + P('M152 160V240M215 160V240M278 160V240', 'stroke="#555" stroke-width="1"') +
    P('M146 196V206M158 196V206M271 196V206M284 196V206', 'stroke="' + Y + '" stroke-width="2"') +
    P('M250 260H300L292 296H258Z', 'fill="#c9c9c9" stroke="' + INK + '"') + R(266, 240, 18, 20, 'fill="#c9c9c9" stroke="' + INK + '"') +
    '<ellipse cx="262" cy="422" rx="10" ry="2.5" fill="#111"/><ellipse cx="290" cy="422" rx="10" ry="2.5" fill="#111"/>' +
    P('M120 424V408h22v16', 'fill="none" stroke="#777" stroke-width="2"');
  int += layer(9, .02, 'fade rise-sm', kit + tag(90, 150, 'MODULAR KITCHEN'));

  // wardrobe
  var ward = R(704, 140, 76, 370, 'fill="url(#wood)" stroke="' + INK + '"') + P('M742 140V510', 'stroke="' + INK + '"') +
    P('M736 300V340M748 300V340', 'stroke="' + Y + '" stroke-width="2.4"');
  int += layer(9, .14, 'fade rise-sm', ward + tag(704, 130, 'WARDROBE'));

  // bedroom window + curtains
  var win = R(800, 150, 104, 150, 'fill="#cfe3f2" stroke="' + INK + '" stroke-width="2"') + P('M852 150V300M800 225H904', 'stroke="' + INK + '"') +
    '<g class="moon">' + C(878, 182, 10, 'fill="#fff7d6"') + '</g>';
  int += layer(9, .2, 'fade', win);
  // bed
  var bed = R(792, 360, 120, 70, 'rx="6" fill="#3b3b3b" stroke="' + INK + '"') + R(786, 430, 132, 34, 'rx="4" fill="#fff" stroke="' + INK + '"') +
    R(800, 418, 44, 18, 'rx="8" fill="#efe9dd" stroke="' + INK + '"') + R(860, 418, 44, 18, 'rx="8" fill="#efe9dd" stroke="' + INK + '"') +
    R(786, 446, 132, 18, 'fill="' + Y + '" opacity=".85"') + R(790, 464, 124, 46, 'fill="url(#wood)" stroke="' + INK + '"');
  int += layer(9, .26, 'fade rise-sm', bed + tag(918, 352, 'BED', 'end'));

  // TV wall + unit + TV
  int += layer(9, .34, 'fade', R(400, 180, 250, 250, 'fill="url(#slats)" opacity=".9"') + R(392, 470, 266, 40, 'fill="#2b2b2b" stroke="' + INK + '"') +
    P('M480 470V510M570 470V510', 'stroke="#555"') + tag(392, 172, 'TV UNIT'));
  int += layer(9, .42, 'pop', R(440, 262, 170, 98, 'rx="3" fill="url(#tv)" stroke="#000" stroke-width="3"') +
    '<g class="tv-screen">' + R(446, 268, 158, 86, 'fill="#1b2433"') + P('M446 330Q500 300 540 316T604 300V354H446Z', 'fill="#2a3a52"') + C(570, 290, 8, 'fill="' + Y + '" opacity=".7"') + '</g>' +
    P('M520 360v6M500 366h40', 'stroke="#111" stroke-width="2"'));
  // sofa (seen from behind, facing TV)
  int += layer(9, .5, 'rise', P('M420 512V470Q420 452 440 452H612Q632 452 632 470V512Z', 'fill="#5c6670" stroke="' + INK + '"') +
    R(410, 476, 22, 36, 'rx="6" fill="#4b545d" stroke="' + INK + '"') + R(620, 476, 22, 36, 'rx="6" fill="#4b545d" stroke="' + INK + '"') +
    R(470, 444, 30, 16, 'rx="5" fill="' + Y + '" stroke="' + INK + '" transform="rotate(-8 485 452)"') + tag(632, 446, 'SOFA'));
  // curtains
  var cur = P('M792 144Q800 220 790 304Q806 300 812 304Q806 220 816 144Z', 'fill="#c9a66b" stroke="#8a6c3c"') +
    P('M888 144Q898 220 892 304Q906 300 914 304Q904 220 912 144Z', 'fill="#c9a66b" stroke="#8a6c3c"') + P('M786 144H918', 'stroke="' + INK + '" stroke-width="2.4"');
  int += layer(9, .6, 'fade drop', cur + tag(918, 138, 'CURTAINS', 'end'));
  // lighting
  var lt = '<g class="lights">' + P('M70 74H342M374 74H670M702 74H930', 'stroke="' + Y + '" stroke-width="3"') +
    P('M470 70V120M580 70V120', 'stroke="' + INK + '"') + P('M458 120H482L476 134H464Z', 'fill="' + INK + '"') + P('M568 120H592L586 134H574Z', 'fill="' + INK + '"') +
    C(470, 142, 30, 'fill="url(#glow)"') + C(580, 142, 30, 'fill="url(#glow)"') + C(215, 120, 36, 'fill="url(#glow)" opacity=".6"') + C(852, 120, 30, 'fill="url(#glow)" opacity=".6"') +
    R(812, 340, 6, 14, 'fill="' + Y + '"') + C(815, 344, 18, 'fill="url(#glow)"') + '</g>';
  int += layer(9, .7, 'fade', lt + tag(500, 104, 'LIGHTING', 'middle'));
  // décor
  int += layer(9, .8, 'fade', R(640, 460, 22, 28, 'fill="#e8e3d8" stroke="' + INK + '"') + P('M651 460q-14 -30 -4 -50q4 22 4 50q2 -26 14 -42q-2 24 -14 42', 'fill="#6f8f55" stroke="#3f5a33" stroke-width=".6"') +
    P('M480 512Q526 530 572 512', 'stroke="#c9a66b" stroke-width="5" fill="none" opacity=".5"'));

  svg += '<g id="sceneInt" class="jx fade" data-s="10" data-t="' + (INTERIOR_FROM - 10).toFixed(3) + '" data-u="11">' + int + '</g>';


  return svg;
}
