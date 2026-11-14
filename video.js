// ============================================================
// video.js — turns a year of photos into a vertical video.
// It draws each photo onto a <canvas> (with a slow zoom and a
// crossfade) and records the canvas with MediaRecorder.
// On iPhone (iOS 14.5+) this produces an .mp4 file.
// ============================================================

export const W = 720;
export const H = 1280;
const FPS = 30;

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const options = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return options.find(t => MediaRecorder.isTypeSupported?.(t)) || null;
}

const nextFrame = () => new Promise(r => requestAnimationFrame(r));
const sleepFrame = () => new Promise(r => setTimeout(r, 1000 / FPS));

async function decode(blob) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(blob); } catch { /* fall through */ }
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

function drawCover(ctx, img, zoom, alpha) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(W / iw, H / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

function caption(ctx, entry) {
  const d = new Date(entry.date + 'T12:00:00');
  const g = ctx.createLinearGradient(0, H - 260, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 260, W, 260);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 52px ui-serif, "New York", Georgia, serif';
  ctx.fillText(d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }), 48, H - 92);
  ctx.font = '500 26px -apple-system, system-ui, sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(d.toLocaleDateString(undefined, { weekday: 'long' }), 50, H - 52);
  ctx.globalAlpha = 1;
}

function titleCard(ctx, year, count, t) {
  ctx.fillStyle = '#121110';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = Math.min(1, t * 3);
  ctx.fillStyle = '#E8805F';
  ctx.textAlign = 'center';
  ctx.font = '600 30px -apple-system, system-ui, sans-serif';
  ctx.fillText('365 DAYS', W / 2, H / 2 - 110);
  ctx.fillStyle = '#F3EFE8';
  ctx.font = '600 170px ui-serif, "New York", Georgia, serif';
  ctx.fillText(String(year), W / 2, H / 2 + 40);
  ctx.font = '400 32px -apple-system, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(243,239,232,.7)';
  ctx.fillText(`${count} days, one photo each`, W / 2, H / 2 + 110);
  ctx.textAlign = 'start';
  ctx.globalAlpha = 1;
}

function endCard(ctx, year, t) {
  ctx.fillStyle = '#121110';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = Math.min(1, t * 3);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F3EFE8';
  ctx.font = 'italic 600 64px ui-serif, "New York", Georgia, serif';
  ctx.fillText('What a year.', W / 2, H / 2);
  ctx.font = '400 30px -apple-system, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(243,239,232,.6)';
  ctx.fillText(`See you in ${year + 1}`, W / 2, H / 2 + 70);
  ctx.textAlign = 'start';
  ctx.globalAlpha = 1;
}

/**
 * entries: sorted entries that have a photo
 * opts: { canvas, year, secondsPer, record, onProgress, signal }
 * returns { blob, mimeType } when recording, otherwise null
 */
export async function playYear(entries, { canvas, year, secondsPer = 0.5, record = true, onProgress = () => {}, signal }) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  let recorder = null, chunks = [], mimeType = null;
  if (record) {
    mimeType = pickMimeType();
    if (mimeType && canvas.captureStream) {
      const stream = canvas.captureStream(FPS);
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    }
  }

  // Keep a few decoded photos ready ahead of time
  const cache = new Map();
  const load = i => {
    if (i >= entries.length) return Promise.resolve(null);
    if (!cache.has(i)) cache.set(i, decode(entries[i].photo).catch(() => null));
    return cache.get(i);
  };

  const timed = async (duration, draw) => {
    const start = performance.now();
    for (;;) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      const t = (performance.now() - start) / (duration * 1000);
      if (t >= 1) break;
      draw(t);
      // rAF pauses when the screen is off; setTimeout keeps ticking
      await (document.hidden ? sleepFrame() : nextFrame());
    }
  };

  titleCard(ctx, year, entries.length, 0);
  recorder?.start(1000);

  try {
    await load(0); load(1); load(2);
    await timed(2.2, t => titleCard(ctx, year, entries.length, t));

    const fade = Math.min(0.35, secondsPer * 0.3);
    for (let i = 0; i < entries.length; i++) {
      const img = await load(i);
      const next = await load(i + 1);
      load(i + 2); load(i + 3);
      await timed(secondsPer, t => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        if (img) drawCover(ctx, img, 1.0 + 0.06 * t, 1);
        caption(ctx, entries[i]);
        const fadeStart = 1 - fade / secondsPer;
        if (next && t > fadeStart && i < entries.length - 1) {
          const a = (t - fadeStart) / (1 - fadeStart);
          drawCover(ctx, next, 1.0, a);
          ctx.globalAlpha = a; caption(ctx, entries[i + 1]); ctx.globalAlpha = 1;
        }
      });
      img?.close?.();
      cache.delete(i);
      onProgress((i + 1) / entries.length);
    }

    await timed(2.2, t => endCard(ctx, year, t));
  } catch (err) {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    cache.forEach(p => p.then(b => b?.close?.()));
    throw err;
  }

  if (!recorder) return null;
  await new Promise(resolve => { recorder.onstop = resolve; recorder.stop(); });
  return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), mimeType };
}
