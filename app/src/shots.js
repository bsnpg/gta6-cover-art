// Fixed scenes for screenshots: ?shot=cover shows one exported cover alone
// (canvas fills the viewport); ?shot=editor shows the editor with a sample
// set loaded. Params: layout, grade, title, tagline, kicker, script, photos
// (comma-separated sample ids), size (e.g. 1080x1350). Legacy params photo /
// caption are still honoured. window.__shotReady is set once painted.
export function parseShot(query) {
  const mode = query.get('shot') === 'cover' ? 'cover' : 'editor';
  let photos = (query.get('photos') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (photos.length === 0 && query.get('photo')) photos = [query.get('photo')];
  let size = null;
  const sizeRaw = query.get('size');
  if (sizeRaw) {
    const m = sizeRaw.match(/^(\d+)x(\d+)$/);
    if (m) size = { w: +m[1], h: +m[2] };
  }
  return {
    mode,
    layout: query.get('layout') || 'hero-left',
    grade: query.get('grade') || 'sunset',
    title: query.get('title') || query.get('caption') || 'DORADA HEAT',
    tagline: query.get('tagline') || 'EVERY STREET IS A STAGE',
    kicker: query.get('kicker') || 'ISLA DORADA',
    script: query.get('script') || 'isla dorada nights',
    photos,
    size,
  };
}

/** Sets window.__shotReady=true after the next two animation frames. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
