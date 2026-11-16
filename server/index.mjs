import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import { aggregateNews } from './feeds.mjs';
import { enrichNewsBilingual } from './translate.mjs';
import { fetchGithubWeekly } from './github-weekly.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 5181);

let cache = { at: 0, payload: null };
let ghCache = { at: 0, payload: null };
const TTL = 10 * 60 * 1000;
const GH_TTL = 60 * 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

async function getNews() {
  const now = Date.now();
  if (cache.payload && now - cache.at < TTL) return cache.payload;
  const raw = await aggregateNews();
  const payload = await enrichNewsBilingual(raw);
  cache = { at: now, payload };
  return payload;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function serveStatic(reqPath, res) {
  if (!fs.existsSync(DIST)) {
    sendJson(res, 503, {
      error: 'frontend not built',
      hint: 'Run npm run build before start',
    });
    return true;
  }

  let filePath = safeJoin(DIST, reqPath === '/' ? '/index.html' : reqPath);
  if (!filePath) {
    sendJson(res, 400, { error: 'bad path' });
    return true;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback
    filePath = path.join(DIST, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: 'not found' });
    return true;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'ai-box' });
    return;
  }

  if (url.pathname === '/api/news') {
    try {
      const force = url.searchParams.get('refresh') === '1';
      if (force) cache = { at: 0, payload: null };
      const data = await getNews();
      sendJson(res, 200, data);
    } catch (error) {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        policy: 'public-rss-and-json-only',
        degraded: true,
        error: String(error?.message || error),
        sources: [],
      });
    }
    return;
  }

  if (url.pathname === '/api/github-weekly') {
    try {
      const force = url.searchParams.get('refresh') === '1';
      const now = Date.now();
      if (force || !ghCache.payload || now - ghCache.at >= GH_TTL) {
        ghCache = { at: now, payload: await fetchGithubWeekly() };
      }
      sendJson(res, 200, ghCache.payload);
    } catch (error) {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        degraded: true,
        error: String(error?.message || error),
        ranking: [],
        sections: { newborn: [], ai: [], active: [] },
      });
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(url.pathname, res);
    return;
  }

  sendJson(res, 405, { error: 'method not allowed' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ai-box] http://127.0.0.1:${PORT} (api + static)`);
});
