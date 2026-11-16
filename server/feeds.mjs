/**
 * 公开源聚合：RSS + HN Algolia + Reddit JSON
 * 不爬取微信/需登录站点
 */

const UA = 'AI-Box-NewsBot/1.0 (+local; educational aggregator)';

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/json, text/xml, */*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = 12000) {
  const text = await fetchText(url, timeoutMs);
  return JSON.parse(text);
}

function stripHtml(s = '') {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRssItems(xml, limit = 8) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks.slice(0, limit * 2)) {
    const title = stripHtml(
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, '') || '',
    );
    const link =
      (block.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] ||
      stripHtml((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '') ||
      (block.match(/<id[^>]*>([\s\S]*?)<\/id>/i) || [])[1] ||
      '';
    const date =
      stripHtml((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || '') ||
      stripHtml((block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) || [])[1] || '') ||
      stripHtml((block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) || [])[1] || '');
    if (!title || !link) continue;
    items.push({ title, url: link.trim(), author: '', publishedAt: date });
    if (items.length >= limit) break;
  }
  return items;
}

async function fromRss(name, icon, color, feedUrl, limit = 8) {
  try {
    const xml = await fetchText(feedUrl);
    return {
      id: name,
      name,
      icon,
      color,
      source: feedUrl,
      ok: true,
      items: parseRssItems(xml, limit),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: name,
      name,
      icon,
      color,
      source: feedUrl,
      ok: false,
      error: String(error.message || error),
      items: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function fromHn() {
  try {
    const data = await fetchJson(
      'https://hn.algolia.com/api/v1/search_by_date?query=AI%20OR%20LLM%20OR%20GPT&tags=story&hitsPerPage=10',
    );
    const items = (data.hits || []).map((h) => ({
      title: h.title || h.story_title || '(no title)',
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      author: h.author || '',
      publishedAt: h.created_at || '',
    }));
    return {
      id: 'hackernews',
      name: 'Hacker News',
      icon: 'https://news.ycombinator.com/favicon.ico',
      color: '#ff6600',
      source: 'hn.algolia.com',
      ok: true,
      items,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: 'hackernews',
      name: 'Hacker News',
      icon: 'https://news.ycombinator.com/favicon.ico',
      color: '#ff6600',
      ok: false,
      error: String(error.message || error),
      items: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

export async function aggregateNews() {
  // Reddit JSON 常被 403，已去掉；单源失败不影响整体 200
  const tasks = [
    fromHn(),
    fromRss('OpenAI Blog', 'https://openai.com/favicon.ico', '#10a37f', 'https://openai.com/blog/rss.xml'),
    fromRss('Google AI Blog', 'https://blog.google/favicon.ico', '#4285f4', 'https://blog.google/technology/ai/rss/'),
    fromRss(
      'Hugging Face',
      'https://huggingface.co/favicon.ico',
      '#ffd21e',
      'https://huggingface.co/blog/feed.xml',
    ),
    fromRss(
      'TechCrunch AI',
      'https://techcrunch.com/favicon.ico',
      '#0a9e01',
      'https://techcrunch.com/category/artificial-intelligence/feed/',
    ),
    fromRss(
      'MIT Tech Review',
      'https://www.technologyreview.com/favicon.ico',
      '#eb1c2d',
      'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    ),
  ];
  const sources = await Promise.all(tasks);
  return {
    generatedAt: new Date().toISOString(),
    policy: 'public-rss-and-json-only',
    sources,
  };
}
