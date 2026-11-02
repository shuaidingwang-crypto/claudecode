// Vessel drawing for 倒空. A vessel is a profile: half-widths down its height, mirrored and smoothed.
// Pebbles settle inside that profile, so any shape can be filled.

// pts: [t, w] pairs, t = 0 at the mouth to 1 at the foot, w = half-width relative to the widest point.
// aspect = widest width / height. fillTo = t that 60 pebbles should reach.
export const SHAPES = {
  meiping: { name: "梅瓶", aspect: 0.62, fillTo: 0.3,
    pts: [[0, 0.24], [0.05, 0.23], [0.09, 0.2], [0.14, 0.42], [0.22, 0.86], [0.32, 1], [0.48, 0.95], [0.7, 0.74], [0.9, 0.56], [1, 0.54]] },
  tsubo: { name: "壶", aspect: 0.88, fillTo: 0.26,
    pts: [[0, 0.36], [0.05, 0.35], [0.1, 0.32], [0.16, 0.56], [0.3, 0.92], [0.5, 1], [0.7, 0.94], [0.88, 0.74], [1, 0.52]] },
  bottle: { name: "长颈瓶", aspect: 0.5, fillTo: 0.42,
    pts: [[0, 0.2], [0.18, 0.19], [0.26, 0.24], [0.34, 0.8], [0.4, 0.98], [0.5, 1], [0.8, 1], [0.95, 0.97], [1, 0.9]] },
  pebble: { name: "卵石罐", aspect: 0.86, fillTo: 0.28,
    pts: [[0, 0.3], [0.06, 0.3], [0.12, 0.5], [0.24, 0.86], [0.42, 1], [0.62, 0.98], [0.82, 0.86], [0.95, 0.6], [1, 0.4]] },
};

export function rand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// Catmull-Rom through the profile points, sampled at t.
function profileAt(pts, t) {
  t = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < pts.length - 2 && t > pts[i + 1][0]) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0] || 1);
  const u2 = u * u, u3 = u2 * u;
  const w = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);
  return Math.max(0.05, w);
}

// Geometry of a vessel placed in a W x H box.
export function vessel(shapeKey, W, H, pad = { top: 14, bottom: 4 }) {
  const s = SHAPES[shapeKey] || SHAPES.meiping;
  const avail = H - pad.top - pad.bottom;
  let h = avail, maxHalf = (h * s.aspect) / 2;
  if (maxHalf * 2 > W - 12) { maxHalf = (W - 12) / 2; h = (maxHalf * 2) / s.aspect; }
  const cx = W / 2, top = pad.top + (avail - h), bottom = top + h;
  const half = (y) => profileAt(s.pts, (y - top) / h) * maxHalf;
  return { s, cx, top, bottom, h, maxHalf, half };
}

function trace(g, v, steps = 72) {
  g.beginPath();
  for (let k = 0; k <= steps; k++) { const y = v.top + (v.h * k) / steps; const x = v.cx - v.half(y); k ? g.lineTo(x, y) : g.moveTo(x, y); }
  for (let k = steps; k >= 0; k--) { const y = v.top + (v.h * k) / steps; g.lineTo(v.cx + v.half(y), y); }
  g.closePath();
}

// Pebble radius so that `cap` pebbles fill from the foot up to fillTo.
function baseRadius(v, cap) {
  let area = 0; const y0 = v.top + v.h * v.s.fillTo, n = 60, dy = (v.bottom - y0) / n;
  for (let k = 0; k < n; k++) area += 2 * v.half(y0 + (k + 0.5) * dy) * dy;
  return Math.sqrt(0.55 * area / (cap * Math.PI));
}

const cache = new Map();
// Greedy drop: each pebble tries several x positions and keeps the lowest place it can rest, inside the walls.
function settle(v, n, seed, r0) {
  const key = [v.s.name, n, seed, Math.round(v.h), Math.round(v.maxHalf), r0.toFixed(2)].join(":");
  if (cache.has(key)) return cache.get(key);
  const out = [], gap = 2;
  const fits = (x, y, r) => {
    for (const dy of [-0.6, 0, 0.6]) if (Math.abs(x - v.cx) + r + gap > v.half(y + dy * r)) return false;
    return y - r > v.top;
  };
  for (let i = 0; i < n; i++) {
    const r = r0 * (0.84 + rand(seed + i * 13) * 0.32);
    let best = null;
    for (let t = 0; t < 16; t++) {
      const span = v.maxHalf - r - gap;
      let x = v.cx + (rand(seed + i * 31 + t * 7) * 2 - 1) * span;
      let y = v.bottom - r - gap;
      for (const o of out) {
        const dx = x - o.x, rr = r + o.r;
        if (Math.abs(dx) < rr) y = Math.min(y, o.y - Math.sqrt(rr * rr - dx * dx));
      }
      if (!fits(x, y, r)) continue;
      if (!best || y > best.y + 0.5) best = { x, y, r };
    }
    if (!best) { // nowhere left that fits cleanly: stack on the centre line
      const top = out.length ? Math.min(...out.map((o) => o.y - o.r)) : v.bottom;
      best = { x: v.cx + (rand(seed + i) - 0.5) * r, y: top - r, r };
    }
    out.push(best);
  }
  cache.set(key, out);
  return out;
}

/**
 * Draw a vessel with pebbles.
 * opts: shape, items (each has .tag), colorOf(tag), cap, seed, jarColor, lidColor,
 *       sealed, lidP (0..1), drop: { index, p } to animate one pebble falling (p 0..1).
 */
export function paintVessel(canvas, opts) {
  const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W) return;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const g = canvas.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const v = vessel(opts.shape, W, H);

  trace(g, v); g.fillStyle = opts.jarColor; g.fill();

  const spots = settle(v, opts.items.length, opts.seed || 1, baseRadius(v, opts.cap || 60));
  g.save(); trace(g, v); g.clip();
  opts.items.forEach((d, i) => {
    const p = spots[i]; let y = p.y;
    if (opts.drop && opts.drop.index === i && opts.drop.p < 1) {
      const e = 1 - Math.pow(1 - opts.drop.p, 3); y = (v.top - p.r) + (p.y - (v.top - p.r)) * e;
    }
    const rot = (rand(i * 11 + (opts.seed || 1)) - 0.5) * 1.2;
    g.beginPath(); g.ellipse(p.x, y, p.r * 1.05, p.r * 0.88, rot, 0, Math.PI * 2);
    g.fillStyle = opts.colorOf(d.tag); g.fill();
  });
  g.restore();

  if (opts.sealed) {
    const e = opts.lidP == null ? 1 : 1 - Math.pow(1 - opts.lidP, 3);
    const mouth = v.half(v.top) * 2, lw = mouth + Math.max(6, mouth * 0.25), lh = Math.max(5, v.h * 0.045);
    g.globalAlpha = e; g.beginPath();
    const ly = v.top - lh * 0.7 - (1 - e) * 22;
    if (g.roundRect) g.roundRect(v.cx - lw / 2, ly, lw, lh, lh / 2); else g.rect(v.cx - lw / 2, ly, lw, lh);
    g.fillStyle = opts.lidColor; g.fill(); g.globalAlpha = 1;
  }
}
