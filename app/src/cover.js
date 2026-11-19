// Dorada Cover Studio — the cover renderer.
// One function, drawCover(canvas, state), draws a complete poster to a canvas
// at ANY resolution. The live preview and the PNG export share it, so what you
// see is what you export (WYSIWYG). Photos are drawn with per-panel crop /
// pan / zoom; grades are canvas filters + tint overlays; all type is drawn
// with the vendored fonts (Anton, Oswald, Yellowtail) via fillText.

export const SAMPLES = [
  { id: 'supercar', name: 'Supercar Sunset', src: 'samples/supercar.jpg' },
  { id: 'woman-sunset', name: 'Woman at Sunset', src: 'samples/woman-sunset.jpg' },
  { id: 'boardwalk-night', name: 'Boardwalk Night', src: 'samples/boardwalk-night.jpg' },
  { id: 'fisherman', name: 'Fisherman', src: 'samples/fisherman.jpg' },
  { id: 'classic-car', name: 'Classic Car', src: 'samples/classic-car.jpg' },
  { id: 'couple-neon', name: 'Couple in Neon', src: 'samples/couple-neon.jpg' },
  { id: 'skyline-dusk', name: 'Skyline at Dusk', src: 'samples/skyline-dusk.jpg' },
  { id: 'speedboat', name: 'Speedboat', src: 'samples/speedboat.jpg' },
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

export const SAMPLE_ORDER = ['supercar', 'woman-sunset', 'boardwalk-night', 'fisherman', 'classic-car', 'couple-neon', 'skyline-dusk', 'speedboat', 'boulevard', 'pier'];

// 5 layouts. Each panel rect is a fraction of the photo area (the canvas
// minus the title band). `labels` name the panels in the editor.
export const LAYOUTS = {
  'hero-left': {
    label: 'Hero Left',
    bandFrac: 0.27,
    panels: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.2, h: 0.5 },
      { x: 0.8, y: 0, w: 0.2, h: 0.5 },
      { x: 0.6, y: 0.5, w: 0.2, h: 0.5 },
      { x: 0.8, y: 0.5, w: 0.2, h: 0.5 },
    ],
    labels: ['Hero', 'Top right', 'Top far right', 'Bottom right', 'Bottom far right'],
  },
  'hero-top': {
    label: 'Hero Top',
    bandFrac: 0.26,
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 0.25, h: 0.42 },
      { x: 0.25, y: 0.58, w: 0.25, h: 0.42 },
      { x: 0.5, y: 0.58, w: 0.25, h: 0.42 },
      { x: 0.75, y: 0.58, w: 0.25, h: 0.42 },
    ],
    labels: ['Hero', 'Bottom 1', 'Bottom 2', 'Bottom 3', 'Bottom 4'],
  },
  'duo-split': {
    label: 'Duo Split',
    bandFrac: 0.27,
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    labels: ['Left', 'Right'],
  },
  'grid-3x3': {
    label: 'Grid 3x3',
    bandFrac: 0.25,
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
  'full-bleed': {
    label: 'Full-Bleed Single',
    bandFrac: 0.25,
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    labels: ['Full photo'],
  },
};

// 6 grades. Each has its own photo filter + tint overlay AND its own title
// band gradient, title colour, accent and script colour — never one gradient
// shared across grades.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.5) contrast(1.1) sepia(0.3) brightness(1.03)',
    tint: 'rgba(255,110,40,0.38)', tintMode: 'overlay',
    band: ['#ff7a18', '#e5386d', '#3b1d5a'],
    title: '#ffffff', titleStroke: 'rgba(20,6,30,0.85)',
    accent: '#ffd23f', script: '#2b0a3d', skyline: 'rgba(12,5,24,0.92)',
  },
  'neon-night': {
    label: 'Neon Night',
    filter: 'saturate(1.7) contrast(1.15) brightness(0.95) hue-rotate(8deg)',
    tint: 'rgba(120,40,255,0.42)', tintMode: 'overlay',
    band: ['#0b1035', '#7b2ff7', '#ff2e88'],
    title: '#ffffff', titleStroke: 'rgba(5,2,25,0.9)',
    accent: '#00f0ff', script: '#ff5da2', skyline: 'rgba(4,2,18,0.92)',
  },
  'golden-hour': {
    label: 'Golden Hour',
    filter: 'sepia(0.45) saturate(1.45) brightness(1.08) contrast(1.05)',
    tint: 'rgba(255,190,60,0.3)', tintMode: 'overlay',
    band: ['#ffb703', '#fb8500', '#7f4f00'],
    title: '#fff7d6', titleStroke: 'rgba(60,25,0,0.85)',
    accent: '#ffffff', script: '#fff3b0', skyline: 'rgba(15,6,0,1)',
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.35) brightness(0.9)',
    tint: 'rgba(0,0,0,0.22)', tintMode: 'multiply',
    band: ['#3a3a3a', '#161616', '#000000'],
    title: '#f5f5f5', titleStroke: 'rgba(0,0,0,0.9)',
    accent: '#e63946', script: '#ff8fa3', skyline: 'rgba(0,0,0,0.95)',
  },
  'teal-heat': {
    label: 'Teal Heat',
    filter: 'saturate(1.5) contrast(1.12) brightness(1.0) hue-rotate(-18deg)',
    tint: 'rgba(0,200,180,0.38)', tintMode: 'overlay',
    band: ['#004d40', '#00897b', '#ff6d00'],
    title: '#ffffff', titleStroke: 'rgba(0,20,18,0.88)',
    accent: '#ffea00', script: '#a7ffeb', skyline: 'rgba(0,18,16,0.92)',
  },
  bubblegum: {
    label: 'Bubblegum',
    filter: 'saturate(1.85) sepia(0.15) brightness(1.08) contrast(1.04)',
    tint: 'rgba(255,80,180,0.32)', tintMode: 'screen',
    band: ['#ff5da2', '#b537f2', '#5a189a'],
    title: '#ffffff', titleStroke: 'rgba(40,0,50,0.85)',
    accent: '#ffe66d', script: '#ffd6f5', skyline: 'rgba(38,2,52,0.92)',
  },
};

export const PRESETS = [
  { title: 'DORADA HEAT', tagline: 'EVERY STREET IS A STAGE', script: 'isla dorada nights' },
  { title: 'NEON TIDES', tagline: 'THE BOARDWALK NEVER SLEEPS', script: 'neon harbor nights' },
  { title: 'GOLDEN HOUR RUN', tagline: 'CHASE THE LAST LIGHT', script: 'golden hour run' },
  { title: 'MIDNIGHT MARINA', tagline: 'EVERY DOCK HAS A SECRET', script: 'midnight marina' },
  { title: 'VELVET GETAWAY', tagline: 'DRIVE FAST, LIVE LOUD', script: 'velvet getaway' },
  { title: 'PALM & POWDER', tagline: 'TWO WORLDS, ONE CITY', script: 'palm & powder' },
  { title: 'HOTEL PARADISO', tagline: 'CHECK IN. NEVER LEAVE.', script: 'hotel paradiso' },
  { title: 'RUNAWAY SUNSET', tagline: 'THE CITY KEEPS THE CHANGE', script: 'runaway sunset' },
];

export const MAX_PANELS = 9;

export function createDefaultState() {
  return {
    layout: 'hero-left',
    grade: 'sunset',
    title: 'DORADA HEAT',
    tagline: 'EVERY STREET IS A STAGE',
    kicker: 'ISLA DORADA',
    script: 'isla dorada nights',
    stickers: { est: true, newBadge: true, heat: 4 },
    panels: Array.from({ length: MAX_PANELS }, () => ({
      img: null, name: '', zoom: 1, panX: 0.5, panY: 0.5, grade: 'global',
    })),
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

/** Pixel rects of every panel for a layout at canvas size W x H. */
export function layoutRects(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] || LAYOUTS['hero-left'];
  const bandH = Math.round(H * layout.bandFrac);
  const areaH = H - bandH;
  const gap = Math.max(4, Math.round(W * 0.008));
  return {
    bandY: areaH, bandH,
    panels: layout.panels.map((r) => ({
      x: r.x * W + gap / 2,
      y: r.y * areaH + gap / 2,
      w: r.w * W - gap,
      h: r.h * areaH - gap,
    })),
  };
}

// Deterministic pseudo-random (fixed seed) so the skyline is identical at
// every resolution and every render.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPanel(ctx, rect, panel, gradeDef, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!panel || !panel.img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#241b33');
    g.addColorStop(1, '#120d1c');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(11, Math.round(rect.w * 0.045))}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PANEL ${index + 1} — DROP A PHOTO`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  } else {
    const img = panel.img;
    const g = panel.grade && panel.grade !== 'global' ? GRADES[panel.grade] : gradeDef;
    const zoom = panel.zoom || 1;
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const dx = rect.x + (rect.w - sw) * clamp(panel.panX ?? 0.5, 0, 1);
    const dy = rect.y + (rect.h - sh) * clamp(panel.panY ?? 0.5, 0, 1);
    ctx.filter = g.filter || 'none';
    ctx.drawImage(img, dx, dy, sw, sh);
    ctx.filter = 'none';
    if (g.tint) {
      ctx.globalCompositeOperation = g.tintMode || 'overlay';
      ctx.fillStyle = g.tint;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();
  // thick white poster border so the panel grid reads at thumbnail size
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
}

// Original skyline silhouette: simple building rects with a few lit windows
// and antennae, drawn from a fixed seed. Not copied from any game's skyline.
function drawSkyline(ctx, x, y, w, h, gradeDef) {
  const rnd = mulberry32(20261119);
  ctx.fillStyle = gradeDef.skyline;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.03 + rnd() * 0.06);
    const bh = h * (0.3 + rnd() * 0.65);
    const by = y + h - bh;
    ctx.fillRect(bx, by, bw, bh);
    // rooftop detail: antenna or water tower
    if (rnd() > 0.6) {
      ctx.fillRect(bx + bw / 2 - 1, by - h * 0.18, 2, h * 0.18);
    } else if (rnd() > 0.7) {
      ctx.fillRect(bx + bw * 0.2, by - h * 0.12, bw * 0.6, h * 0.12);
    }
    // a few lit windows
    ctx.fillStyle = gradeDef.accent;
    const wins = Math.floor(rnd() * 5);
    for (let i = 0; i < wins; i++) {
      ctx.globalAlpha = 0.25 + rnd() * 0.55;
      ctx.fillRect(bx + 2 + rnd() * Math.max(2, bw - 6), by + 3 + rnd() * Math.max(2, bh - 8), 2.5, 3.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = gradeDef.skyline;
    bx += bw + w * 0.004;
  }
}

function drawStarburst(ctx, cx, cy, r, label, lines) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.beginPath();
  const points = 12;
  for (let i = 0; i < points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.72;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,6,30,0.9)';
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.stroke();
  ctx.fillStyle = '#1a0b2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = r * 0.3;
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * 1.15);
  });
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, filled, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, family, weight, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size = Math.max(10, size * 0.92);
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws the complete poster for `state` onto `canvas` at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS['hero-left'];
  const grade = GRADES[state.grade] || GRADES.sunset;
  const { bandY, bandH, panels } = layoutRects(state.layout, W, H);

  // backdrop: warm-white poster gutters behind the panels
  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, W, bandY + bandH);
  ctx.fillStyle = '#0d0b14';
  ctx.fillRect(0, bandY, W, bandH);

  // photo panels
  panels.forEach((rect, i) => drawPanel(ctx, rect, state.panels[i], grade, i));

  // ---- title band ----
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, grade.band[0]);
  band.addColorStop(0.55, grade.band[1]);
  band.addColorStop(1, grade.band[2]);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
  // accent stripe on the band's top edge
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, W, Math.max(2, bandH * 0.02));

  // skyline silhouette behind the title (below the script line, above the
  // tagline) — buildings never cross the script.
  drawSkyline(ctx, 0, bandY + bandH * 0.34, W, bandH * 0.3, grade);

  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // HEAT block width, reserved before the tagline is placed so the two
  // never collide.
  const heat = state.stickers ? (state.stickers.heat || 0) : 0;
  const u = Math.max(W, H) / 1000; // scale unit
  const sr = Math.max(7, bandH * 0.08);
  const heatBlockW = heat > 0
    ? Math.round(sr * 5.2) + 5 * sr * 2.3 + Math.round(20 * u)
    : 0;

  // neon script line
  const script = (state.script || '').trim();
  if (script) {
    const sSize = fitFont(ctx, script, 'Yellowtail, cursive', '', bandH * 0.2, W * 0.7);
    ctx.font = `${sSize}px Yellowtail, cursive`;
    ctx.fillStyle = grade.script;
    ctx.shadowColor = grade.script;
    ctx.shadowBlur = sSize * 0.35;
    ctx.fillText(script, cx, bandY + bandH * 0.22);
    ctx.shadowBlur = 0;
  }

  // big condensed title, auto-fit to the band — the first thing the eye
  // lands on, readable even at thumbnail size
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const tSize = fitFont(ctx, title, 'Anton, sans-serif', '', bandH * 0.58, W * 0.94);
    ctx.font = `${tSize}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = grade.titleStroke;
    ctx.lineWidth = Math.max(2, tSize * 0.08);
    ctx.strokeText(title, cx, bandY + bandH * 0.74);
    ctx.fillStyle = grade.title;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = tSize * 0.08;
    ctx.shadowOffsetY = tSize * 0.02;
    ctx.fillText(title, cx, bandY + bandH * 0.74);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // tagline — centred in the space left of the HEAT block, never under it.
  // NOTE: ctx.letterSpacing is NOT included in measureText(), so the
  // auto-fit measures the spacing by hand or the spaced text overflows.
  const tagline = (state.tagline || '').trim().toUpperCase();
  if (tagline) {
    const tagMaxW = heat > 0 ? W - heatBlockW - W * 0.06 : W * 0.86;
    const tagCx = heat > 0 ? (W - heatBlockW) / 2 : cx;
    let gSize = bandH * 0.11;
    const spacingFor = (s) => Math.max(1, s * 0.22);
    ctx.font = `600 ${gSize}px Oswald, sans-serif`;
    while (gSize > 10 && ctx.measureText(tagline).width + tagline.length * spacingFor(gSize) > tagMaxW) {
      gSize *= 0.92;
      ctx.font = `600 ${gSize}px Oswald, sans-serif`;
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacingFor(gSize)}px`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(tagline, tagCx, bandY + bandH * 0.93);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // ---- stickers ----
  // kicker badge, top-left over the photo area
  const kicker = (state.kicker || '').trim().toUpperCase();
  if (kicker) {
    ctx.font = `700 ${Math.round(15 * u + 4)}px Oswald, sans-serif`;
    const kw = ctx.measureText(kicker).width;
    const kh = Math.round(26 * u + 6);
    const kx = Math.round(14 * u + 6);
    const ky = Math.round(14 * u + 6);
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    ctx.roundRect(kx, ky, kw + kh * 1.1, kh, kh / 2);
    ctx.fill();
    ctx.fillStyle = '#14081f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(kicker, kx + kh * 0.55, ky + kh / 2 + 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // NEW badge right of the kicker
    if (state.stickers && state.stickers.newBadge) {
      const nx = kx + kw + kh * 1.1 + 10 * u;
      ctx.save();
      ctx.translate(nx + kh * 0.5, ky + kh / 2);
      ctx.rotate(0.06);
      ctx.fillStyle = '#ff2e63';
      ctx.beginPath();
      ctx.roundRect(-kh * 0.55, -kh / 2, kh * 1.1, kh, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(13 * u + 3)}px Oswald, sans-serif`;
      ctx.fillText('NEW', 0, 1);
      ctx.restore();
    }
  }
  // EST. 2026 starburst, top-right
  if (state.stickers && state.stickers.est) {
    const r = Math.max(26, 34 * u);
    drawStarburst(ctx, W - r - Math.round(16 * u), r + Math.round(16 * u), r, '', ['EST.', '2026']);
  }
  // HEAT stars, bottom-right of the band
  if (heat > 0) {
    const totalW = 5 * sr * 2.3;
    const sy = bandY + bandH * 0.93;
    const sx0 = W - totalW - Math.round(18 * u);
    ctx.font = `700 ${Math.round(sr * 1.6)}px Oswald, sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('HEAT', sx0 - Math.round(sr * 5.2), sy);
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, sx0 + i * sr * 2.3 + sr, sy, sr, i < heat, grade.accent);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  }
}

/** Renders `state` to a fresh canvas at w x h and returns it. */
export function renderCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}
