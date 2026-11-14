// ============================================================
// app.js — the 365 Days app.
// Plain JavaScript, no frameworks, no build step.
// Screens: Today, Day (any date), Calendar, Timeline, More.
// ============================================================

import * as db from './db.js';
import { createZip, readZip } from './zip.js';
import { playYear, pickMimeType } from './video.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const app = $('#app');

// ---------- Dates (always local "YYYY-MM-DD") ----------
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => keyOf(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const dayOfYear = k => { const d = parseKey(k); return Math.round((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 1; };
const daysInYear = y => (new Date(y, 1, 29).getMonth() === 1 ? 366 : 365);
const fmt = (k, o) => parseKey(k).toLocaleDateString(undefined, o);
const isDateKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Settings (small, kept in localStorage) ----------
const SETTINGS_KEY = 'days365.settings';
const defaults = { theme: 'auto', reminderTime: '20:00', lastBackup: 0, lockHash: '', lockSalt: '', hideInstall: false, backupDismissedAt: 0 };
const settings = { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
const saveSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
}
applyTheme();

// ---------- State ----------
const state = {
  entries: new Map(),     // date -> entry
  thumbURLs: new Map(),   // date -> object URL (small square)
  photoURLs: new Map(),   // date -> object URL (full photo)
  calMonth: null,         // { y, m }
};

const hasPhoto = k => !!state.entries.get(k)?.photo;
const hasText = k => !!state.entries.get(k)?.text?.trim();

function urlFor(map, date, field) {
  const e = state.entries.get(date);
  if (!e?.[field]) return null;
  if (!map.has(date)) map.set(date, URL.createObjectURL(e[field]));
  return map.get(date);
}
const thumbURL = d => urlFor(state.thumbURLs, d, 'thumb');
const photoURL = d => urlFor(state.photoURLs, d, 'photo');
function dropURLs(date) {
  for (const m of [state.thumbURLs, state.photoURLs]) {
    if (m.has(date)) { URL.revokeObjectURL(m.get(date)); m.delete(date); }
  }
}

// ---------- Streaks (a day counts when it has a photo) ----------
function streaks() {
  let k = todayKey();
  if (!hasPhoto(k)) k = addDays(k, -1); // today isn't over yet, so the streak is still alive
  let current = 0;
  while (hasPhoto(k)) { current++; k = addDays(k, -1); }

  let best = 0, run = 0, prev = null;
  for (const d of [...state.entries.keys()].filter(hasPhoto).sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  const year = new Date().getFullYear();
  const thisYear = [...state.entries.keys()].filter(d => d.startsWith(year + '-') && hasPhoto(d)).length;
  return { current, best, thisYear };
}

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Sheets (bottom modals) ----------
function openSheet(html) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog">${html}</div>`;
  wrap.addEventListener('click', e => { if (e.target === wrap && !wrap.dataset.locked) wrap.remove(); });
  document.body.appendChild(wrap);
  return wrap;
}

// ---------- Saving / sharing files ----------
// On iPhone, the share sheet lets you "Save to Files" (iCloud Drive) — the
// best way to keep backups. Falls back to a normal download elsewhere.
async function saveFile(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60_000);
  return true;
}

// ---------- Photo processing ----------
async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file); } catch { /* HEIC etc. — try <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJPEG(img, maxSide, quality, square = false) {
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (square) {
    const s = Math.min(sw, sh);
    sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s;
  }
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * scale);
  c.height = Math.round(sh * scale);
  c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Could not process photo'))), 'image/jpeg', quality));
}

async function processPhoto(file) {
  const img = await decodeImage(file);
  const photo = await toJPEG(img, 2048, 0.86);
  const thumb = await toJPEG(img, 360, 0.72, true);
  img.close?.();
  return { photo, thumb };
}

// ---------- Save entry ----------
async function saveEntry(date, patch) {
  const prev = state.entries.get(date);
  const now = Date.now();
  const entry = { date, text: '', createdAt: now, ...prev, ...patch, updatedAt: now };
  if (!entry.photo && !entry.text.trim()) {
    if (prev) { await db.del(date); state.entries.delete(date); }
  } else {
    await db.put(entry);
    state.entries.set(date, entry);
  }
  if ('photo' in patch) dropURLs(date);
}

// Ask the browser not to clear our data when storage is low
async function requestPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}

// ============================================================
// Screens
// ============================================================

const icons = {
  camera: '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8c.3-.4.7-.7 1.2-.7h3c.5 0 .9.3 1.2.7L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.4" r="3.4"/></svg>',
};

const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function bannersHTML() {
  let html = '';
  if (!isStandalone() && !settings.hideInstall) {
    html += `<div class="banner" id="installBanner"><div class="grow"><b>Install 365 Days</b><br><span class="small muted">${isIOS()
      ? 'Tap <b>Share</b> then <b>Add to Home Screen</b>. Your journal is safest in the installed app.'
      : 'Use your browser’s “Install” or “Add to Home Screen” option.'}</span></div><button class="x" data-dismiss="install" aria-label="Dismiss">✕</button></div>`;
  }
  const days = (Date.now() - settings.lastBackup) / 864e5;
  const snoozed = (Date.now() - settings.backupDismissedAt) / 864e5 < 3;
  if (state.entries.size >= 3 && days > 7 && !snoozed) {
    const msg = settings.lastBackup ? `Last backup was ${Math.floor(days)} days ago.` : 'You haven’t made a backup yet.';
    html += `<div class="banner"><div class="grow"><b>Back up your journal</b><br><span class="small muted">${msg}</span></div><button data-act="backup">Back up</button><button class="x" data-dismiss="backup" aria-label="Snooze">✕</button></div>`;
  }
  return html;
}

function wireBanners(root) {
  $$('[data-dismiss]', root).forEach(b => b.onclick = () => {
    if (b.dataset.dismiss === 'install') settings.hideInstall = true;
    else settings.backupDismissedAt = Date.now();
    saveSettings();
    b.closest('.banner').remove();
  });
  $$('[data-act="backup"]', root).forEach(b => b.onclick = exportAll);
}

// ---------- Day / Today screen ----------
function renderDay(date, isToday) {
  const entry = state.entries.get(date) || { date, text: '' };
  const year = parseKey(date).getFullYear();
  const s = streaks();

  const head = isToday
    ? `<div class="eyebrow">${fmt(date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
       <h1 class="display">Day ${dayOfYear(date)} <span class="of">of ${daysInYear(year)}</span></h1>`
    : `<button class="back" id="back">‹ Back</button>
       <div class="eyebrow">${fmt(date, { weekday: 'long' })} · Day ${dayOfYear(date)}</div>
       <h1 class="display">${fmt(date, { month: 'long', day: 'numeric', year: 'numeric' })}</h1>`;

  const stats = isToday ? `
    <div class="stats">
      <div class="stat flame"><b>${s.current}</b><span>🔥 day streak</span></div>
      <div class="stat"><b>${s.best}</b><span>best streak</span></div>
      <div class="stat"><b>${s.thisYear}</b><span>photos in ${new Date().getFullYear()}</span></div>
    </div>` : '';

  const photo = entry.photo
    ? `<img src="${photoURL(date)}" alt="Photo for ${fmt(date, { month: 'long', day: 'numeric' })}"><button class="change" id="changePhoto">Change</button>`
    : `<button class="add-photo" id="addPhoto"><div class="lens">${icons.camera}</div><strong>${isToday ? 'Add today’s photo' : 'Add a photo'}</strong><span class="small">Take one or choose from your library</span></button>`;

  // "On this day" — same date in earlier years
  let memory = '';
  if (isToday) {
    for (let back = 1; back <= 5; back++) {
      const d = parseKey(date); d.setFullYear(d.getFullYear() - back);
      const k = keyOf(d);
      if (state.entries.has(k)) {
        const e = state.entries.get(k);
        memory = `<a class="card memory" href="#/day/${k}">${e.thumb ? `<img src="${thumbURL(k)}" alt="">` : ''}
          <div class="t"><b>On this day, ${back} year${back > 1 ? 's' : ''} ago</b>${esc((e.text || '').slice(0, 70))}${(e.text || '').length > 70 ? '…' : ''}</div></a>`;
        break;
      }
    }
  }

  app.innerHTML = `
    <header class="page-head"><div>${head}</div></header>
    ${isToday ? bannersHTML() : ''}
    ${stats}
    <section class="photo-card" id="photoCard">${photo}</section>
    <input type="file" id="fileInput" accept="image/*" hidden>
    <section class="card journal">
      <textarea id="text" placeholder="${isToday ? 'How was your day?' : 'What happened this day?'}" aria-label="Journal entry">${esc(entry.text)}</textarea>
      <div class="meta"><span id="wc"></span><span id="saved"></span></div>
    </section>
    ${memory}
    ${state.entries.has(date) ? '<button class="danger-link" id="delete">Delete this entry</button>' : ''}
  `;

  wireBanners(app);
  $('#back')?.addEventListener('click', () => (history.length > 1 ? history.back() : (location.hash = '#/calendar')));

  // Photo picking
  const input = $('#fileInput');
  const pick = () => input.click();
  $('#addPhoto')?.addEventListener('click', pick);
  $('#changePhoto')?.addEventListener('click', () => {
    const sh = openSheet(`<h2>Photo</h2>
      <button class="btn" data-a="replace">Replace photo</button>
      <button class="btn secondary" data-a="save">Save to Photos / Files</button>
      <button class="btn secondary" data-a="remove" style="color:var(--danger)">Remove photo</button>
      <button class="btn secondary" data-a="cancel">Cancel</button>`);
    sh.onclick = async e => {
      const a = e.target.dataset?.a;
      if (!a) return;
      sh.remove();
      if (a === 'replace') pick();
      if (a === 'save') saveFile(state.entries.get(date).photo, `365-days-${date}.jpg`);
      if (a === 'remove' && confirm('Remove this photo?')) {
        await saveEntry(date, { photo: null, thumb: null });
        renderDay(date, isToday);
      }
    };
  });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const card = $('#photoCard');
    card.classList.add('busy');
    try {
      const { photo, thumb } = await processPhoto(file);
      await saveEntry(date, { photo, thumb, text: $('#text').value });
      requestPersistence();
      const after = streaks();
      toast(isToday && after.current > 1 ? `🔥 ${after.current}-day streak!` : 'Photo saved');
      renderDay(date, isToday);
    } catch (err) {
      console.error(err);
      card.classList.remove('busy');
      alert('Sorry, that photo couldn’t be opened. Try a different one.');
    }
  });

  // Journal: grows as you type, autosaves after you pause
  const ta = $('#text');
  const savedEl = $('#saved');
  const wc = $('#wc');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  const count = () => {
    const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
    wc.textContent = n ? `${n} word${n === 1 ? '' : 's'}` : '';
  };
  let timer, dirty = false;
  const save = async () => {
    if (!dirty) return;
    dirty = false;
    await saveEntry(date, { text: ta.value });
    savedEl.textContent = 'Saved';
  };
  ta.addEventListener('input', () => {
    grow(); count(); dirty = true;
    savedEl.textContent = 'Editing…';
    clearTimeout(timer);
    timer = setTimeout(save, 600);
  });
  ta.addEventListener('blur', save);
  currentSave = save;
  requestAnimationFrame(() => { grow(); count(); });

  $('#delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete the photo and journal entry for ${fmt(date, { month: 'long', day: 'numeric', year: 'numeric' })}? This can’t be undone.`)) return;
    await db.del(date);
    state.entries.delete(date);
    dropURLs(date);
    toast('Entry deleted');
    isToday ? renderDay(date, true) : history.back();
  });
}
let currentSave = null; // lets us flush unsaved text when the app goes to the background

// ---------- Calendar ----------
function renderCalendar() {
  const now = new Date();
  if (!state.calMonth) state.calMonth = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = state.calMonth;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const today = todayKey();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();

  const weekdayNames = [...Array(7)].map((_, i) => new Date(2023, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));
  let cells = '';
  for (let i = 0; i < first.getDay(); i++) cells += '<div class="cell blank"></div>';
  let captured = 0;
  for (let d = 1; d <= days; d++) {
    const k = `${y}-${pad(m + 1)}-${pad(d)}`;
    const cls = ['cell'];
    let style = '';
    if (hasPhoto(k)) { cls.push('has-photo'); style = `style="background-image:url(${thumbURL(k)})"`; captured++; }
    if (hasText(k)) cls.push('has-text');
    if (k === today) cls.push('today');
    if (k > today) cls.push('future');
    cells += `<a class="${cls.join(' ')}" ${style} href="#/day/${k}" aria-label="${fmt(k, { month: 'long', day: 'numeric' })}">${d}</a>`;
  }
  const s = streaks();
  const elapsed = isCurrentMonth ? now.getDate() : (first > now ? 0 : days);

  app.innerHTML = `
    <header class="page-head"><div><div class="eyebrow">Calendar</div><h1 class="display">${first.toLocaleDateString(undefined, { month: 'long' })} <span class="of">${y}</span></h1></div></header>
    <div class="stats">
      <div class="stat"><b>${captured}<span class="of" style="font-size:16px">/${elapsed}</span></b><span>days this month</span></div>
      <div class="stat flame"><b>${s.current}</b><span>🔥 streak</span></div>
      <div class="stat"><b>${s.thisYear}</b><span>this year</span></div>
    </div>
    <div class="month-nav">
      <button id="prev" aria-label="Previous month">‹</button>
      <button id="todayBtn" style="width:auto;padding:0 16px;font-size:15px;font-weight:600">Today</button>
      <button id="next" aria-label="Next month" ${isCurrentMonth ? 'disabled' : ''}>›</button>
    </div>
    <div class="weekdays">${weekdayNames.map(w => `<div>${w}</div>`).join('')}</div>
    <div class="grid">${cells}</div>
    <p class="legend">Tap any past day to add or edit it · <span style="color:var(--accent)">●</span> has a journal entry</p>
  `;
  const go = delta => { const d = new Date(y, m + delta, 1); state.calMonth = { y: d.getFullYear(), m: d.getMonth() }; renderCalendar(); };
  $('#prev').onclick = () => go(-1);
  $('#next').onclick = () => go(1);
  $('#todayBtn').onclick = () => { state.calMonth = null; renderCalendar(); };

  // Swipe left/right to change months
  let x0 = null;
  const grid = $('.grid');
  grid.addEventListener('touchstart', e => (x0 = e.touches[0].clientX), { passive: true });
  grid.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) { if (dx > 0) go(-1); else if (!isCurrentMonth) go(1); }
    x0 = null;
  });
}

// ---------- Timeline ----------
let lazyObserver;
function renderTimeline() {
  const dates = [...state.entries.keys()].sort().reverse();
  if (!dates.length) {
    app.innerHTML = `<header class="page-head"><div><div class="eyebrow">Timeline</div><h1 class="display">Memories</h1></div></header>
      <div class="empty"><div class="big">Your story starts today</div>Add a photo on the Today tab and it will appear here.</div>`;
    return;
  }
  let html = `<header class="page-head"><div><div class="eyebrow">Timeline</div><h1 class="display">Memories</h1></div>
    <span class="muted small">${dates.length} ${dates.length === 1 ? 'day' : 'days'}</span></header>`;
  let lastMonth = '';
  for (const d of dates) {
    const e = state.entries.get(d);
    const month = d.slice(0, 7);
    if (month !== lastMonth) {
      html += `<div class="month-label">${fmt(d, { month: 'long', year: 'numeric' })}</div>`;
      lastMonth = month;
    }
    html += `<a class="card tl-item" href="#/day/${d}">
      ${e.photo ? `<div class="ph"><img data-date="${d}" alt="" ${e.thumb ? `src="${thumbURL(d)}"` : ''}></div>` : ''}
      <div class="body"><div class="date">${fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })} · Day ${dayOfYear(d)}</div>
      ${e.text?.trim() ? `<p>${esc(e.text.trim())}</p>` : '<p class="muted" style="font-family:var(--sans);font-size:15px">No words this day.</p>'}</div></a>`;
  }
  app.innerHTML = html;

  // Show the small thumbnail instantly, swap in the sharp photo when it scrolls into view
  lazyObserver?.disconnect();
  lazyObserver = new IntersectionObserver(items => {
    for (const it of items) {
      if (!it.isIntersecting) continue;
      const img = it.target;
      img.src = photoURL(img.dataset.date);
      lazyObserver.unobserve(img);
    }
  }, { rootMargin: '600px 0px' });
  $$('img[data-date]').forEach(img => lazyObserver.observe(img));
}

// ---------- More / Settings ----------
async function renderSettings() {
  const years = [...new Set([...state.entries.keys()].filter(hasPhoto).map(d => d.slice(0, 4)))].sort().reverse();
  const canRecord = !!pickMimeType();
  let storageText = '';
  try {
    const est = await navigator.storage?.estimate?.();
    const persisted = await navigator.storage?.persisted?.();
    if (est) storageText = `${(est.usage / 1048576).toFixed(1)} MB used${persisted ? ' · protected from automatic cleanup' : ''}`;
  } catch {}

  app.innerHTML = `
    <header class="page-head"><div><div class="eyebrow">More</div><h1 class="display">Settings</h1></div></header>

    <h3>Year in review</h3>
    <div class="group">
      <div class="row"><span class="label">Year</span>
        <select id="vYear">${years.length ? years.map(y => `<option>${y}</option>`).join('') : '<option disabled>No photos yet</option>'}</select></div>
      <div class="row"><span class="label">Time per photo</span>
        <select id="vSpeed"><option value="0.3">Fast (0.3s)</option><option value="0.5" selected>Normal (0.5s)</option><option value="1">Slow (1s)</option><option value="2">Very slow (2s)</option></select></div>
      <button class="row action" id="makeVideo" ${years.length ? '' : 'disabled'}>${canRecord ? 'Create video' : 'Play slideshow'}<span class="chev">›</span></button>
    </div>
    <p class="note" id="vNote"></p>

    <h3>Daily reminder</h3>
    <div class="group">
      <div class="row"><span class="label">Remind me at</span><input type="time" id="rTime" value="${settings.reminderTime}"></div>
      <button class="row action" id="addReminder">Set up reminder<span class="chev">›</span></button>
    </div>

    <h3>Appearance</h3>
    <div class="group">
      <div class="row"><span class="label">Theme</span>
        <div class="seg" id="theme">${['auto', 'light', 'dark'].map(t => `<button data-t="${t}" class="${settings.theme === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
    </div>

    <h3>Privacy</h3>
    <div class="group">
      <div class="row"><span class="label">Passcode lock<small>Ask for a 4-digit code when the app opens</small></span>
        <label class="switch"><input type="checkbox" id="lockToggle" ${settings.lockHash ? 'checked' : ''}><span></span></label></div>
    </div>
    <p class="note">Everything stays on this iPhone. Nothing is uploaded anywhere — there are no accounts and no servers.</p>

    <h3>Backup &amp; export</h3>
    <div class="group">
      <button class="row action" id="backup">Back up / export everything<span class="chev">›</span></button>
      <button class="row action" id="exportText">Export journal as text<span class="chev">›</span></button>
      <button class="row action" id="restore">Restore from a backup<span class="chev">›</span></button>
      <div class="row"><span class="label muted small">Last backup</span><span class="small muted">${settings.lastBackup ? new Date(settings.lastBackup).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</span></div>
    </div>
    <p class="note">Backups are a single .zip with all photos and entries. Choose <b>Save to Files → iCloud Drive</b> so they’re stored off your phone. You’ll get a nudge here every week.</p>
    <input type="file" id="restoreInput" accept=".zip,application/zip" hidden>

    <h3>Storage</h3>
    <div class="group"><div class="row"><span class="label small">${storageText || 'Unavailable'}</span></div></div>

    <p class="note" style="text-align:center;margin-top:30px">365 Days · v1.0<br>One photo. One page. Every day.</p>
  `;

  $('#vNote').textContent = canRecord
    ? 'Plays your year and records it as a video you can save to Photos. Keep the app open while it records.'
    : 'This browser can’t record video, so you’ll get a full-screen slideshow instead.';

  $('#makeVideo').onclick = () => yearInReview($('#vYear').value, Number($('#vSpeed').value), canRecord);
  $('#rTime').onchange = e => { settings.reminderTime = e.target.value; saveSettings(); };
  $('#addReminder').onclick = reminderSheet;
  $$('#theme button').forEach(b => b.onclick = () => { settings.theme = b.dataset.t; saveSettings(); applyTheme(); renderSettings(); });
  $('#lockToggle').onchange = async e => {
    if (e.target.checked) {
      const ok = await setPasscode();
      e.target.checked = ok;
    } else {
      const ok = await askPasscode(true);
      if (ok) { settings.lockHash = ''; settings.lockSalt = ''; saveSettings(); toast('Passcode removed'); }
      else e.target.checked = true;
    }
  };
  $('#backup').onclick = exportAll;
  $('#exportText').onclick = async () => saveFile(new Blob([journalMarkdown()], { type: 'text/markdown' }), `365-days-journal-${todayKey()}.md`);
  $('#restore').onclick = () => $('#restoreInput').click();
  $('#restoreInput').onchange = e => e.target.files[0] && restoreFrom(e.target.files[0]);
}

// ============================================================
// Reminders
// iPhone web apps can't schedule local notifications without a
// server, so we add a repeating event (with an alert) to Calendar.
// ============================================================
function reminderSheet() {
  const [hh, mm] = settings.reminderTime.split(':');
  const sh = openSheet(`
    <h2>Daily reminder</h2>
    <p class="muted">Pick one — both work great on iPhone.</p>
    <button class="btn" id="ics">Add to my Calendar</button>
    <p class="note">Downloads a repeating ${settings.reminderTime} event with an alert. Open it and tap <b>Add All</b>.</p>
    <h3 style="margin-top:22px">Or use the Reminders app</h3>
    <ol class="steps">
      <li>Open <b>Reminders</b> and add “📸 365 Days”.</li>
      <li>Tap ⓘ → turn on <b>Date</b> and <b>Time</b> (${new Date(2000, 0, 1, hh, mm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}).</li>
      <li>Set <b>Repeat</b> to <b>Daily</b>.</li>
    </ol>
    <button class="btn secondary" id="close">Done</button>`);
  $('#close', sh).onclick = () => sh.remove();
  $('#ics', sh).onclick = () => {
    const start = todayKey().replace(/-/g, '') + `T${hh}${mm}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//365 Days//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', `UID:365days-daily-${Date.now()}@365days`, `DTSTAMP:${stamp}`,
      `DTSTART:${start}`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY',
      'SUMMARY:📸 365 Days — photo + journal', `URL:${location.origin}${location.pathname}`,
      'DESCRIPTION:Take today’s photo and write a few lines.',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Time for today’s photo', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    // A normal link works best for calendar files on iPhone
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '365-days-reminder.ics';
    a.click();
    toast('Open the file and tap “Add All”');
  };
}

// ============================================================
// Export / backup / restore
// ============================================================
function journalMarkdown() {
  const dates = [...state.entries.keys()].sort();
  let md = `# 365 Days — Journal\n\nExported ${new Date().toLocaleString()}\n\n`;
  for (const d of dates) {
    const e = state.entries.get(d);
    md += `## ${fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;
    if (e.photo) md += `![Photo](photos/${d}.jpg)\n\n`;
    md += `${(e.text || '').trim() || '_No entry._'}\n\n---\n\n`;
  }
  return md;
}

async function exportAll() {
  if (!state.entries.size) { toast('Nothing to export yet'); return; }
  const sh = openSheet(`<h2>Backup</h2><p class="muted" id="bMsg">Packing your photos and entries…</p>
    <div class="progress"><i id="bBar"></i></div><button class="btn" id="bSave" disabled>Preparing…</button>
    <button class="btn secondary" id="bClose">Cancel</button>`);
  sh.dataset.locked = '1';
  let cancelled = false;
  $('#bClose', sh).onclick = () => { cancelled = true; sh.remove(); };

  const dates = [...state.entries.keys()].sort();
  const files = [];
  const json = { app: '365 Days', format: 1, exportedAt: new Date().toISOString(), entries: [] };
  for (const d of dates) {
    const e = state.entries.get(d);
    if (e.photo) files.push({ name: `photos/${d}.jpg`, data: e.photo });
    json.entries.push({ date: d, text: e.text || '', photo: e.photo ? `photos/${d}.jpg` : null, createdAt: e.createdAt, updatedAt: e.updatedAt });
  }
  files.push({ name: 'journal.json', data: JSON.stringify(json, null, 2) });
  files.push({ name: 'Journal.md', data: journalMarkdown() });
  files.push({ name: 'README.txt', data: '365 Days backup\n\nphotos/ — one JPEG per day\nJournal.md — every entry, readable anywhere\njournal.json — used by 365 Days to restore (More → Restore from a backup)\n' });

  try {
    const zip = await createZip(files, (n, t) => { if (!cancelled) $('#bBar', sh).style.width = `${(n / t) * 100}%`; });
    if (cancelled) return;
    const name = `365-days-backup-${todayKey()}.zip`;
    $('#bMsg', sh).innerHTML = `Ready: ${dates.length} days, ${(zip.size / 1048576).toFixed(1)} MB.<br>Choose <b>Save to Files</b> → <b>iCloud Drive</b>.`;
    const btn = $('#bSave', sh);
    btn.disabled = false;
    btn.textContent = 'Save backup file';
    // Sharing needs a fresh tap on iPhone, so we wait for this button
    btn.onclick = async () => {
      const ok = await saveFile(zip, name);
      if (ok) {
        settings.lastBackup = Date.now();
        saveSettings();
        toast('Backup saved');
        sh.remove();
        route();
      }
    };
    $('#bClose', sh).textContent = 'Close';
  } catch (err) {
    console.error(err);
    $('#bMsg', sh).textContent = 'Something went wrong while packing the backup: ' + err.message;
  }
}

async function restoreFrom(file) {
  const sh = openSheet(`<h2>Restore</h2><p class="muted" id="rMsg">Reading backup…</p><div class="progress"><i id="rBar"></i></div>`);
  sh.dataset.locked = '1';
  try {
    const items = await readZip(file);
    const jsonItem = items.find(i => i.name === 'journal.json');
    if (!jsonItem) throw new Error('This backup is missing journal.json.');
    const data = JSON.parse(await jsonItem.blob.text());
    const byName = new Map(items.map(i => [i.name, i.blob]));
    const entries = (data.entries || []).filter(e => isDateKey(e.date));

    const clashes = entries.filter(e => state.entries.has(e.date)).length;
    sh.remove();
    if (!confirm(`Restore ${entries.length} days from this backup?${clashes ? `\n\n${clashes} day(s) already on this phone will be replaced by the backup version.` : ''}`)) return;

    const sh2 = openSheet(`<h2>Restoring…</h2><p class="muted" id="rMsg">Please keep the app open.</p><div class="progress"><i id="rBar"></i></div>`);
    sh2.dataset.locked = '1';
    let n = 0;
    for (const e of entries) {
      const rec = { date: e.date, text: e.text || '', createdAt: e.createdAt || Date.now(), updatedAt: e.updatedAt || Date.now() };
      const blob = e.photo && byName.get(e.photo);
      if (blob) {
        const jpg = new Blob([blob], { type: 'image/jpeg' });
        const img = await decodeImage(jpg);
        rec.photo = jpg;
        rec.thumb = await toJPEG(img, 360, 0.72, true);
        img.close?.();
      }
      if (rec.photo || rec.text.trim()) {
        await db.put(rec);
        state.entries.set(rec.date, rec);
        dropURLs(rec.date);
      }
      $('#rBar', sh2).style.width = `${(++n / entries.length) * 100}%`;
    }
    requestPersistence();
    sh2.remove();
    toast(`Restored ${n} days`);
    route();
  } catch (err) {
    console.error(err);
    sh.remove();
    alert('Couldn’t restore: ' + err.message);
  }
}

// ============================================================
// Year in review (video / slideshow)
// ============================================================
async function yearInReview(year, secondsPer, record) {
  const list = [...state.entries.values()].filter(e => e.photo && e.date.startsWith(year + '-')).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return;
  const total = Math.round(list.length * secondsPer + 4.4);

  document.body.classList.add('fullscreen');
  const wrap = document.createElement('div');
  wrap.className = 'player';
  wrap.innerHTML = `<canvas></canvas><div class="progress"><i></i></div>
    <div class="status">${record ? `Recording ${list.length} photos · about ${Math.floor(total / 60)}m ${total % 60}s. Keep the app open.` : 'Playing your year'}</div>
    <div class="ctrls"><button class="btn secondary" id="stop">Cancel</button></div>`;
  document.body.appendChild(wrap);

  // Keep the screen awake while recording, where supported
  let wake = null;
  try { wake = await navigator.wakeLock?.request('screen'); } catch {}

  const ctrl = new AbortController();
  const close = () => { ctrl.abort(); wake?.release?.(); wrap.remove(); document.body.classList.remove('fullscreen'); };
  $('#stop', wrap).onclick = close;

  try {
    const result = await playYear(list, {
      canvas: $('canvas', wrap), year: Number(year), secondsPer, record, signal: ctrl.signal,
      onProgress: p => ($('.progress i', wrap).style.width = `${p * 100}%`),
    });
    wake?.release?.();
    if (!result) { close(); return; }

    const ext = result.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(result.blob);
    wrap.innerHTML = `<video src="${url}" controls playsinline autoplay></video>
      <div class="status">${(result.blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}</div>
      <div class="ctrls"><button class="btn secondary" id="done">Done</button><button class="btn" id="save">Save video</button></div>`;
    $('#save', wrap).onclick = () => saveFile(result.blob, `365-days-${year}.${ext}`);
    $('#done', wrap).onclick = () => { URL.revokeObjectURL(url); close(); };
  } catch (err) {
    if (err.name !== 'AbortError') { console.error(err); alert('The video couldn’t be finished: ' + err.message); }
    close();
  }
}

// ============================================================
// Passcode lock (a privacy screen — the code is stored as a
// salted SHA-256 hash, never as plain text)
// ============================================================
async function hash(code, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + code));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function keypad(title, { cancellable }) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'lock';
    el.innerHTML = `<div class="eyebrow">365 Days</div><h2>${title}</h2><div class="dots">${'<i></i>'.repeat(4)}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
      <button class="ghost" data-k="cancel">${cancellable ? 'Cancel' : ''}</button><button data-k="0">0</button><button class="ghost" data-k="del">Delete</button></div>`;
    document.body.appendChild(el);
    document.body.classList.add('locked');
    let code = '';
    const dots = $$('.dots i', el);
    const finish = v => { el.remove(); document.body.classList.remove('locked'); resolve(v); };
    el.api = {
      shake() { code = ''; dots.forEach(d => d.classList.remove('on')); const ds = $('.dots', el); ds.classList.remove('shake'); void ds.offsetWidth; ds.classList.add('shake'); },
      finish,
      setTitle(t) { $('h2', el).textContent = t; },
    };
    el.addEventListener('click', e => {
      const k = e.target.dataset?.k;
      if (!k) return;
      if (k === 'cancel') { if (cancellable) finish(null); return; }
      if (k === 'del') code = code.slice(0, -1);
      else if (code.length < 4) code += k;
      dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
      if (code.length === 4) { const c = code; setTimeout(() => el.onCode?.(c, el.api), 120); }
    });
    keypad.current = el;
  });
}

function askPasscode(cancellable = false) {
  return new Promise(resolve => {
    const p = keypad('Enter passcode', { cancellable });
    const el = keypad.current;
    el.onCode = async (code, api) => {
      if ((await hash(code, settings.lockSalt)) === settings.lockHash) api.finish(true);
      else api.shake();
    };
    p.then(v => resolve(!!v));
  });
}

function setPasscode() {
  return new Promise(resolve => {
    let first = null;
    const p = keypad('Choose a passcode', { cancellable: true });
    const el = keypad.current;
    el.onCode = async (code, api) => {
      if (!first) { first = code; api.setTitle('Confirm passcode'); api.shake(); $('.dots', el).classList.remove('shake'); return; }
      if (code !== first) { first = null; api.setTitle('Didn’t match — try again'); api.shake(); return; }
      settings.lockSalt = crypto.getRandomValues(new Uint32Array(4)).join('-');
      settings.lockHash = await hash(code, settings.lockSalt);
      saveSettings();
      toast('Passcode on');
      api.finish(true);
    };
    p.then(v => resolve(!!v));
  });
}

let hiddenAt = 0;
let locking = false;
async function lockIfNeeded() {
  if (!settings.lockHash || locking) return;
  locking = true;
  await askPasscode(false);
  locking = false;
}

// ============================================================
// Router
// ============================================================
function route() {
  const hash = location.hash || '#/today';
  const [, page, arg] = hash.split('/');
  const tab = page === 'day' ? (arg === todayKey() ? 'today' : null) : page;
  $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (tab || (page === 'day' ? '' : 'today'))));
  currentSave = null;
  lazyObserver?.disconnect();
  window.scrollTo(0, 0);

  if (page === 'day' && isDateKey(arg) && arg <= todayKey()) renderDay(arg, arg === todayKey());
  else if (page === 'calendar') renderCalendar();
  else if (page === 'timeline') renderTimeline();
  else if (page === 'settings') renderSettings();
  else renderDay(todayKey(), true);
}

// ============================================================
// Start
// ============================================================
async function start() {
  try {
    for (const e of await db.getAll()) state.entries.set(e.date, e);
  } catch (err) {
    console.error(err);
    app.innerHTML = '<div class="empty"><div class="big">Storage unavailable</div>Private Browsing blocks saving. Please open 365 Days in a normal Safari tab or from your Home Screen.</div>';
    return;
  }
  window.addEventListener('hashchange', route);
  route();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      currentSave?.();
      hiddenAt = Date.now();
    } else {
      if (settings.lockHash && Date.now() - hiddenAt > 60_000) lockIfNeeded();
      // New day while the app was open in the background? Refresh Today.
      if ((location.hash || '#/today') === '#/today') route();
    }
  });
  window.addEventListener('pagehide', () => currentSave?.());

  lockIfNeeded();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker not registered', err));
  }
}

start();
