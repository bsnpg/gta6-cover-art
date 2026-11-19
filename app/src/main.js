// Dorada Cover Studio — the editor.
// Wires the sidebar (1 Photos, 2 Layout, 3 Grade, 4 Caption, 5 Export) to the
// single canvas renderer in cover.js. The live preview and the PNG export
// share drawCover, so the preview is the export. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).
import {
  drawCover, renderCover, LAYOUTS, GRADES, SAMPLES, SAMPLE_ORDER, PRESETS,
  createDefaultState, layoutRects,
} from './cover.js';
import { parseShot, markShotReady } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelListEl = document.getElementById('panel-list');
const hintEl = document.getElementById('hint');

const state = createDefaultState();
let selectedPanel = 0;
let exportSize = { w: 1920, h: 1080 };
let shotMode = null;

const $ = (id) => document.getElementById(id);

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function sampleById(id) {
  return SAMPLES.find((s) => s.id === id);
}

async function setPanelPhoto(i, sampleId) {
  const panel = state.panels[i];
  if (!sampleId) {
    panel.img = null;
    panel.name = '';
  } else {
    const sample = sampleById(sampleId);
    if (!sample) return;
    panel.img = await loadImage(sample.src);
    panel.name = sample.name;
  }
  panel.zoom = 1;
  panel.panX = 0.5;
  panel.panY = 0.5;
  redraw();
}

/** Loads the 4+ distinct samples into the current layout's panels, in order. */
async function useSampleSet() {
  const layout = LAYOUTS[state.layout];
  const ids = SAMPLE_ORDER.slice(0, layout.panels.length);
  for (let i = 0; i < layout.panels.length; i++) {
    await setPanelPhoto(i, ids[i % ids.length]);
  }
  buildPanelList();
  statusEl.textContent = `Loaded ${layout.panels.length} sample photos — drag a panel to pan, scroll to zoom.`;
}

function fillAllPanels(sampleId) {
  const layout = LAYOUTS[state.layout];
  const sample = sampleById(sampleId);
  if (!sample) return;
  (async () => {
    const img = await loadImage(sample.src);
    for (let i = 0; i < layout.panels.length; i++) {
      const p = state.panels[i];
      p.img = img;
      p.name = sample.name;
      p.zoom = 1;
      p.panX = 0.5;
      p.panY = 0.5;
    }
    buildPanelList();
    redraw();
    statusEl.textContent = `All ${layout.panels.length} panels filled with “${sample.name}”.`;
  })();
}

function randomize() {
  const layoutIds = Object.keys(LAYOUTS);
  const gradeIds = Object.keys(GRADES);
  state.layout = layoutIds[Math.floor(Math.random() * layoutIds.length)];
  state.grade = gradeIds[Math.floor(Math.random() * gradeIds.length)];
  const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  state.title = preset.title;
  state.tagline = preset.tagline;
  state.script = preset.script;
  state.stickers.heat = 1 + Math.floor(Math.random() * 5);
  // shuffle the sample order so panels never repeat a photo
  const ids = [...SAMPLE_ORDER];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const layout = LAYOUTS[state.layout];
  (async () => {
    for (let i = 0; i < layout.panels.length; i++) {
      await setPanelPhoto(i, ids[i % ids.length]);
    }
    syncControls();
    buildPanelList();
    statusEl.textContent = `Randomized: ${layout.label} · ${GRADES[state.grade].label} · “${state.title}”.`;
  })();
}

// ---- preview sizing ----
function previewDims() {
  const s = Math.min(1, 1000 / Math.max(exportSize.w, exportSize.h));
  return { w: Math.max(2, Math.round(exportSize.w * s)), h: Math.max(2, Math.round(exportSize.h * s)) };
}

function redraw() {
  if (shotMode === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    const d = previewDims();
    if (canvas.width !== d.w || canvas.height !== d.h) {
      canvas.width = d.w;
      canvas.height = d.h;
    }
  }
  drawCover(canvas, state);
  // selection outline on the preview (editor only)
  if (!shotMode) {
    const ctx = canvas.getContext('2d');
    const { panels } = layoutRects(state.layout, canvas.width, canvas.height);
    const r = panels[selectedPanel];
    if (r) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.restore();
    }
  }
}

// ---- sidebar controls ----
function buildLayoutButtons() {
  const wrap = $('layout-buttons');
  wrap.innerHTML = '';
  for (const [id, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (state.layout === id ? ' active' : '');
    b.textContent = `${def.label} · ${def.panels.length} panel${def.panels.length > 1 ? 's' : ''}`;
    b.addEventListener('click', () => {
      state.layout = id;
      selectedPanel = 0;
      syncControls();
      buildPanelList();
      redraw();
    });
    wrap.appendChild(b);
  }
}

function buildGradeButtons() {
  const wrap = $('grade-buttons');
  wrap.innerHTML = '';
  for (const [id, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick grade' + (state.grade === id ? ' active' : '');
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${def.band[0]}, ${def.band[1]}, ${def.band[2]})"></span>${def.label}`;
    b.addEventListener('click', () => {
      state.grade = id;
      syncControls();
      redraw();
    });
    wrap.appendChild(b);
  }
}

function buildPanelList() {
  const layout = LAYOUTS[state.layout];
  panelListEl.innerHTML = '';
  layout.panels.forEach((_, i) => {
    const panel = state.panels[i];
    const row = document.createElement('div');
    row.className = 'panel-row' + (selectedPanel === i ? ' selected' : '');
    row.addEventListener('click', () => {
      selectedPanel = i;
      buildPanelList();
      redraw();
    });

    const head = document.createElement('div');
    head.className = 'panel-head';
    const headLabel = document.createElement('span');
    headLabel.textContent = `Panel ${i + 1} · ${layout.labels[i] || ''}`;
    head.appendChild(headLabel);
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'mini head-upload';
    uploadBtn.textContent = 'Upload…';
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedPanel = i;
      $('file-input').click();
    });
    head.appendChild(uploadBtn);
    row.appendChild(head);

    const photoSel = document.createElement('select');
    photoSel.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '— empty —';
    photoSel.appendChild(empty);
    for (const s of SAMPLES) {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name;
      photoSel.appendChild(o);
    }
    const currentId = panel.img ? (SAMPLES.find((s) => s.name === panel.name) || {}).id || '' : '';
    photoSel.value = panel.img && !panel.name.startsWith('Upload') ? currentId : '';
    photoSel.addEventListener('change', async (e) => {
      e.stopPropagation();
      await setPanelPhoto(i, e.target.value);
      buildPanelList();
    });
    photoSel.addEventListener('click', (e) => e.stopPropagation());
    row.appendChild(photoSel);

    const gradeSel = document.createElement('select');
    gradeSel.setAttribute('aria-label', `Grade override for panel ${i + 1}`);
    const g0 = document.createElement('option');
    g0.value = 'global';
    g0.textContent = 'Grade: Global';
    gradeSel.appendChild(g0);
    for (const [gid, gdef] of Object.entries(GRADES)) {
      const o = document.createElement('option');
      o.value = gid;
      o.textContent = `Grade: ${gdef.label}`;
      gradeSel.appendChild(o);
    }
    gradeSel.value = panel.grade || 'global';
    gradeSel.addEventListener('change', (e) => {
      e.stopPropagation();
      panel.grade = e.target.value;
      redraw();
    });
    gradeSel.addEventListener('click', (e) => e.stopPropagation());

    const midRow = document.createElement('div');
    midRow.className = 'mid-row';
    midRow.appendChild(gradeSel);

    const zoomRow = document.createElement('div');
    zoomRow.className = 'zoom-row';
    const zoomLabel = document.createElement('span');
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom || 1);
    zoom.setAttribute('aria-label', `Zoom for panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      redraw();
    });
    zoom.addEventListener('click', (e) => e.stopPropagation());
    zoomRow.appendChild(zoomLabel);
    zoomRow.appendChild(zoom);
    midRow.appendChild(zoomRow);
    row.appendChild(midRow);

    panelListEl.appendChild(row);
  });
}

function syncControls() {
  $('title').value = state.title;
  $('tagline').value = state.tagline;
  $('kicker').value = state.kicker;
  $('script-line').value = state.script;
  $('sticker-est').checked = !!state.stickers.est;
  $('sticker-new').checked = !!state.stickers.newBadge;
  $('sticker-heat').value = String(state.stickers.heat);
  document.querySelectorAll('#layout-buttons .pick').forEach((b, i) => {
    b.classList.toggle('active', Object.keys(LAYOUTS)[i] === state.layout);
  });
  document.querySelectorAll('#grade-buttons .pick').forEach((b, i) => {
    b.classList.toggle('active', Object.keys(GRADES)[i] === state.grade);
  });
  document.querySelectorAll('.size-pick').forEach((b) => {
    b.classList.toggle('active', `${exportSize.w}x${exportSize.h}` === b.dataset.size);
  });
}

// ---- export ----
function exportPNG(w, h) {
  statusEl.textContent = `Rendering ${w}×${h}…`;
  const cover = renderCover(state, w, h);
  cover.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — the canvas could not produce a PNG.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dorada-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved dorada-cover-${w}x${h}.png (${(blob.size / 1024).toFixed(0)} KB).`;
  }, 'image/png');
}

// ---- pointer: click to select, drag to pan, wheel to zoom ----
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const { panels } = layoutRects(state.layout, canvas.width, canvas.height);
  const i = panels.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (i < 0) return;
  selectedPanel = i;
  buildPanelList();
  redraw();
  const panel = state.panels[i];
  drag = { i, startX: p.x, startY: p.y, panX: panel.panX, panY: panel.panY, rect: panels[i] };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[drag.i];
  const img = panel.img;
  if (!img) return;
  const scale = Math.max(drag.rect.w / img.naturalWidth, drag.rect.h / img.naturalHeight) * (panel.zoom || 1);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const dx = p.x - drag.startX;
  const dy = p.y - drag.startY;
  if (sw > drag.rect.w) panel.panX = Math.min(1, Math.max(0, drag.panX + dx / (drag.rect.w - sw)));
  if (sh > drag.rect.h) panel.panY = Math.min(1, Math.max(0, drag.panY + dy / (drag.rect.h - sh)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selectedPanel];
  if (!panel || !panel.img) return;
  panel.zoom = Math.min(3, Math.max(1, (panel.zoom || 1) * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  buildPanelList();
  redraw();
}, { passive: false });

// ---- wiring ----
$('use-samples').addEventListener('click', useSampleSet);
$('randomize').addEventListener('click', randomize);
$('fill-all').addEventListener('click', () => fillAllPanels($('fill-sample').value));
$('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const panel = state.panels[selectedPanel];
  panel.img = await loadImage(URL.createObjectURL(file));
  panel.name = `Upload: ${file.name}`;
  panel.zoom = 1;
  panel.panX = 0.5;
  panel.panY = 0.5;
  buildPanelList();
  redraw();
  statusEl.textContent = `Loaded “${file.name}” into Panel ${selectedPanel + 1}.`;
  e.target.value = '';
});

for (const key of ['title', 'tagline', 'kicker', 'script-line']) {
  $(key).addEventListener('input', (e) => {
    if (key === 'title') state.title = e.target.value;
    if (key === 'tagline') state.tagline = e.target.value;
    if (key === 'kicker') state.kicker = e.target.value;
    if (key === 'script-line') state.script = e.target.value;
    redraw();
  });
}
$('sticker-est').addEventListener('change', (e) => { state.stickers.est = e.target.checked; redraw(); });
$('sticker-new').addEventListener('change', (e) => { state.stickers.newBadge = e.target.checked; redraw(); });
$('sticker-heat').addEventListener('change', (e) => { state.stickers.heat = Number(e.target.value); redraw(); });

document.querySelectorAll('.size-pick').forEach((b) => {
  b.addEventListener('click', () => {
    const [w, h] = b.dataset.size.split('x').map(Number);
    exportSize = { w, h };
    syncControls();
    redraw();
  });
});
document.querySelectorAll('.export-btn').forEach((b) => {
  b.addEventListener('click', () => {
    const [w, h] = b.dataset.size.split('x').map(Number);
    exportPNG(w, h);
  });
});

// ---- shot scenes ----
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');

async function init() {
  // Load the vendored fonts before the first paint so canvas text is real.
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('600 20px Oswald'),
      document.fonts.load('40px Yellowtail'),
      document.fonts.ready,
    ]);
  } catch { /* fonts fall back to system faces; the app still draws */ }

  buildLayoutButtons();
  buildGradeButtons();
  buildPanelList();
  syncControls();

  if (shotName) {
    const shot = parseShot(params);
    shotMode = shot.mode;
    document.body.classList.add(`shot-${shot.mode}`);
    state.layout = LAYOUTS[shot.layout] ? shot.layout : 'hero-left';
    state.grade = GRADES[shot.grade] ? shot.grade : 'sunset';
    state.title = shot.title;
    state.tagline = shot.tagline;
    state.kicker = shot.kicker;
    state.script = shot.script;
    if (shot.size && shot.mode === 'cover') {
      exportSize = shot.size;
    }
    const ids = shot.photos.length > 0 ? shot.photos : SAMPLE_ORDER;
    const layout = LAYOUTS[state.layout];
    for (let i = 0; i < layout.panels.length; i++) {
      const id = ids[i % ids.length];
      if (sampleById(id)) await setPanelPhoto(i, id);
    }
    syncControls();
    buildPanelList();
    if (shot.mode === 'editor') {
      hintEl.textContent = 'Panel: Hero — drag to pan · scroll to zoom · drop a photo here';
    }
    redraw();
    markShotReady();
  } else {
    await useSampleSet();
    redraw();
  }
}

init();
