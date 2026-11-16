/**
 * 本周 GitHub 高分项目榜
 * - 近 7 日新建高星
 * - 近 7 日有推送的高星活跃项目
 * 可选环境变量 GITHUB_TOKEN 提高限额
 */

import { bilingualTitle, detectLang } from './translate.mjs';

const UA = 'AI-Box-NewsBot/1.0 (+local; github-weekly)';

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function ghJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function mapRepo(r, bucket) {
  return {
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description || '暂无简介',
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    language: r.language || 'Other',
    topics: Array.isArray(r.topics) ? r.topics.slice(0, 6) : [],
    owner: r.owner?.login || '',
    ownerAvatar: r.owner?.avatar_url || '',
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    homepage: r.homepage || '',
    bucket,
  };
}

async function searchRepos(query, perPage = 20) {
  const url =
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}` +
    `&sort=stars&order=desc&per_page=${perPage}`;
  const data = await ghJson(url);
  return data.items || [];
}

export async function fetchGithubWeekly() {
  const since = isoDateDaysAgo(7);
  const errors = [];

  let newborn = [];
  let active = [];
  let aiFocus = [];

  try {
    newborn = await searchRepos(`created:>=${since} stars:>5`, 15);
  } catch (e) {
    errors.push(`newborn: ${e.message || e}`);
  }
  try {
    active = await searchRepos(`pushed:>=${since} stars:>2000`, 15);
  } catch (e) {
    errors.push(`active: ${e.message || e}`);
  }
  try {
    aiFocus = await searchRepos(
      `pushed:>=${since} stars:>100 (AI OR LLM OR GPT OR agent OR MCP) in:name,description,topics`,
      15,
    );
  } catch (e) {
    errors.push(`ai: ${e.message || e}`);
  }

  const seen = new Set();
  const merge = [];
  const pushUnique = (list, bucket) => {
    for (const r of list) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merge.push(mapRepo(r, bucket));
    }
  };

  pushUnique(newborn, '本周新晋');
  pushUnique(aiFocus, 'AI 相关');
  pushUnique(active, '高星活跃');

  merge.sort((a, b) => b.stars - a.stars);

  const withRank = async (list, bucket) => {
    const mapped = list.slice(0, bucket ? 10 : 30).map((raw, i) => {
      const r = bucket ? mapRepo(raw, bucket) : raw;
      return { rank: i + 1, ...r };
    });
    return enrichReposBilingual(mapped);
  };

  const ranking = await withRank(merge.slice(0, 30), null);
  const sections = {
    newborn: await withRank(newborn, '本周新晋'),
    ai: await withRank(aiFocus, 'AI 相关'),
    active: await withRank(active, '高星活跃'),
  };

  return {
    generatedAt: new Date().toISOString(),
    weekStart: since,
    policy: 'github-search-api',
    bilingual: true,
    translator: 'mymemory',
    total: ranking.length,
    errors,
    ranking,
    sections,
  };
}

async function enrichReposBilingual(repos) {
  // 去重描述再翻译，减少 MyMemory 请求
  const descKeys = [...new Set(repos.map((r) => (r.description || '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
  const biMap = new Map();
  for (const desc of descKeys) {
    biMap.set(desc, await bilingualTitle(desc));
  }

  return repos.map((r) => {
    const raw = (r.description || '').replace(/\s+/g, ' ').trim() || '暂无官方简介';
    const bi = biMap.get(raw) || {
      title: raw,
      titleZh: detectLang(raw) === 'zh' ? raw : raw,
      titleEn: raw,
      lang: detectLang(raw),
    };
    const descriptionZh = bi.titleZh || raw;
    const descriptionEn = bi.titleEn || raw;
    return {
      ...r,
      descriptionZh,
      descriptionEn,
      intro: buildIntro(r, descriptionZh),
      introZh: buildIntro(r, descriptionZh),
      introEn: buildIntroEn(r, descriptionEn),
    };
  });
}

function metaZh(r) {
  const meta = [];
  if (r.language) meta.push(`语言 ${r.language}`);
  if (r.stars) meta.push(`★ ${formatNum(r.stars)}`);
  if (r.bucket) meta.push(r.bucket);
  if (r.topics?.length) meta.push(`话题 ${r.topics.slice(0, 3).join(' / ')}`);
  return meta.join(' · ');
}

function metaEn(r) {
  const meta = [];
  if (r.language) meta.push(r.language);
  if (r.stars) meta.push(`★ ${formatNum(r.stars)}`);
  if (r.bucket) meta.push(r.bucket);
  if (r.topics?.length) meta.push(r.topics.slice(0, 3).join(' / '));
  return meta.join(' · ');
}

function buildIntro(r, summary) {
  const text = (summary || r.description || '暂无官方简介').replace(/\s+/g, ' ').trim();
  const meta = metaZh(r);
  return meta ? `${text}（${meta}）` : text;
}

function buildIntroEn(r, summary) {
  const text = (summary || r.description || 'No description').replace(/\s+/g, ' ').trim();
  const meta = metaEn(r);
  return meta ? `${text} (${meta})` : text;
}

function formatNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
