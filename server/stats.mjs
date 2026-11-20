import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE = path.join(__dirname, '..', 'data', 'stats.json');
const DAY_KEEP = 60;

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function emptyState() {
  return {
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPageviews: 0,
    totalVisitors: 0,
    paths: {},
    daily: {},
    visitors: {},
  };
}

function load() {
  try {
    if (!fs.existsSync(STORE)) return emptyState();
    const raw = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    return {
      ...emptyState(),
      ...raw,
      paths: raw.paths || {},
      daily: raw.daily || {},
      visitors: raw.visitors || {},
    };
  } catch {
    return emptyState();
  }
}

let state = load();
let dirty = false;
let writing = false;

function prune() {
  const keys = Object.keys(state.daily).sort();
  if (keys.length <= DAY_KEEP) return;
  for (const k of keys.slice(0, keys.length - DAY_KEEP)) delete state.daily[k];

  const cutoff = Date.now() - DAY_KEEP * 24 * 60 * 60 * 1000;
  for (const [id, meta] of Object.entries(state.visitors)) {
    const last = Date.parse(meta?.lastSeen || 0);
    if (!last || last < cutoff) delete state.visitors[id];
  }
}

function persist() {
  if (!dirty || writing) return;
  writing = true;
  dirty = false;
  try {
    prune();
    fs.mkdirSync(path.dirname(STORE), { recursive: true });
    const tmp = `${STORE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, STORE);
  } catch (err) {
    dirty = true;
    console.warn('[stats] persist failed:', err?.message || err);
  } finally {
    writing = false;
  }
}

const persistTimer = setInterval(persist, 15_000);
persistTimer.unref?.();
process.on('beforeExit', persist);

export function ensureVisitorId(cookieHeader = '') {
  const m = String(cookieHeader).match(/(?:^|;\s*)aibox_vid=([A-Za-z0-9_-]{8,64})/);
  if (m) return { id: m[1], isNew: false };
  const id = crypto.randomBytes(16).toString('hex');
  return { id, isNew: true };
}

export function trackEvent({ path: pagePath, visitorId, userAgent = '' }) {
  const p = normalizePath(pagePath);
  const day = todayKey();
  const now = new Date().toISOString();

  state.totalPageviews += 1;
  state.paths[p] = (state.paths[p] || 0) + 1;
  if (!state.daily[day]) state.daily[day] = { pageviews: 0, visitors: [] };
  state.daily[day].pageviews += 1;

  const known = state.visitors[visitorId];
  if (!known) {
    state.totalVisitors += 1;
    state.visitors[visitorId] = { firstSeen: now, lastSeen: now, hits: 1, ua: String(userAgent).slice(0, 120) };
    if (!state.daily[day].visitors.includes(visitorId)) state.daily[day].visitors.push(visitorId);
  } else {
    known.lastSeen = now;
    known.hits = (known.hits || 0) + 1;
    if (!state.daily[day].visitors.includes(visitorId)) state.daily[day].visitors.push(visitorId);
  }

  state.updatedAt = now;
  dirty = true;
  return snapshot();
}

function normalizePath(input) {
  let p = String(input || 'home').trim();
  if (p.startsWith('http')) {
    try {
      const u = new URL(p);
      p = u.hash ? u.hash.slice(1) : u.pathname.replace(/^\/+/, '');
    } catch {
      /* ignore */
    }
  }
  if (p.startsWith('#')) p = p.slice(1);
  p = p.replace(/^\/+/, '').split('?')[0].slice(0, 80);
  return p || 'home';
}

export function snapshot() {
  const day = todayKey();
  const today = state.daily[day] || { pageviews: 0, visitors: [] };
  const topPaths = Object.entries(state.paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([path, pageviews]) => ({ path, pageviews }));

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = todayKey(d);
    const row = state.daily[key] || { pageviews: 0, visitors: [] };
    last7.push({
      date: key,
      pageviews: row.pageviews || 0,
      visitors: Array.isArray(row.visitors) ? row.visitors.length : 0,
    });
  }

  return {
    ok: true,
    note: 'Render Free 重启/重新部署后统计可能清零；本机 data/stats.json 可持久化。',
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    totalPageviews: state.totalPageviews,
    totalVisitors: state.totalVisitors,
    today: {
      date: day,
      pageviews: today.pageviews || 0,
      visitors: Array.isArray(today.visitors) ? today.visitors.length : 0,
    },
    last7,
    topPaths,
  };
}
