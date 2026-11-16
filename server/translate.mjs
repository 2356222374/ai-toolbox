/**
 * 资讯标题中英互译（MyMemory 公开接口 + 内存缓存）
 * 不依赖付费 Key；失败时保留原文
 */

const cache = new Map();
const UA = 'AI-Box-NewsBot/1.0 (+local; translate)';

export function detectLang(text = '') {
  const s = String(text);
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cjk >= 2 && cjk / Math.max(s.length, 1) >= 0.15) return 'zh';
  return 'en';
}

async function fetchJson(url, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function translateText(text, from, to) {
  const q = String(text || '').trim();
  if (!q) return '';
  if (from === to) return q;
  const key = `${from}|${to}|${q}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 450))}&langpair=${from}|${to}`;
    const data = await fetchJson(url);
    const out = String(data?.responseData?.translatedText || '').trim();
    // MyMemory 有时返回限流提示
    if (!out || /MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(out)) {
      cache.set(key, q);
      return q;
    }
    cache.set(key, out);
    return out;
  } catch {
    cache.set(key, q);
    return q;
  }
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  return results;
}

function decodeEntities(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** 为单条资讯补全 titleZh / titleEn */
export async function bilingualTitle(title) {
  const original = decodeEntities(String(title || '').trim());
  const lang = detectLang(original);
  if (lang === 'zh') {
    const titleEn = await translateText(original, 'zh-CN', 'en');
    return { title: original, titleZh: original, titleEn, lang: 'zh' };
  }
  const titleZh = await translateText(original, 'en', 'zh-CN');
  return { title: original, titleZh, titleEn: original, lang: 'en' };
}

/** 给整包 news sources 加双语字段 */
export async function enrichNewsBilingual(payload) {
  const sources = payload?.sources || [];
  const flat = [];
  sources.forEach((s, si) => {
    (s.items || []).forEach((item, ii) => {
      flat.push({ si, ii, title: item.title });
    });
  });

  const translated = await mapPool(flat, 5, async (row) => bilingualTitle(row.title));

  translated.forEach((bi, n) => {
    const { si, ii } = flat[n];
    const item = sources[si].items[ii];
    item.titleZh = bi.titleZh;
    item.titleEn = bi.titleEn;
    item.lang = bi.lang;
  });

  return {
    ...payload,
    bilingual: true,
    translator: 'mymemory',
    translatedAt: new Date().toISOString(),
    sources,
  };
}
