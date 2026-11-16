import { CATALOG, RECOMMENDED, type ToolItem } from './tools';
import { SCENES, type ScenePick } from './scenes';

/** 产品级导航（不放进自动生成的 tools.ts，避免合并脚本覆盖） */
export const PRODUCT_NAV: { id: string; title: string; icon: string; group?: 'product' | 'catalog' }[] = [
  { id: 'daily', title: '今日 AI', icon: '🌅', group: 'product' },
  { id: 'scenes', title: '场景选型', icon: '🎯', group: 'product' },
  { id: 'news', title: '最新资讯', icon: '📰', group: 'product' },
  { id: 'github', title: 'GitHub 周榜', icon: '🏆', group: 'product' },
  { id: 'recommend', title: '常用推荐', icon: '⭐', group: 'product' },
  { id: 'submit', title: '提交收录', icon: '➕', group: 'product' },
  { id: 'standards', title: '精选标准', icon: '✅', group: 'product' },
];

export const CURATION_STANDARDS = [
  {
    title: '能说清「适合谁」',
    desc: '没有明确用户与场景的工具，只进「其他」，不进场景精选。',
  },
  {
    title: '可访问、可验证',
    desc: '官网可打开；中转/套壳站降权，合作位必须标注「赞助」。',
  },
  {
    title: '少而精优先于多而全',
    desc: '场景卡每组不超过 8 个；详情页写清替代品与限制。',
  },
  {
    title: '日更可感知',
    desc: '「今日 AI」固定：资讯精选 + 新收录/值得试，形成回访理由。',
  },
  {
    title: '编辑与广告分离',
    desc: '精选排序不售卖；广告位独立展示，不与编辑推荐混排。',
  },
];

/** 今日值得试：按日期轮换，保证每天有稳定内容 */
export const DAILY_TRY_POOL: { match: string; hook: string; fallback?: ToolItem }[] = [
  { match: 'Cursor', hook: '本周默认写代码入口' },
  { match: 'DeepSeek', hook: '高性价比推理对话' },
  { match: '即梦', hook: '国内图/视频一站式' },
  { match: '扣子', hook: '快速搭一个办公 Bot' },
  { match: 'Perplexity', hook: '带出处的调研问答' },
  { match: 'Loomy', hook: '桌面端轻量 Agent' },
  { match: 'AiPPT', hook: '交差型 PPT 生成' },
  { match: '可灵', hook: '短视频生成试试手' },
  { match: 'Dify', hook: '知识库应用起步' },
  { match: 'Claude', hook: '长文与代码审查' },
  {
    match: 'n8n',
    hook: '把重复流程自动化',
    fallback: {
      name: 'n8n',
      desc: '开源工作流自动化',
      url: 'https://n8n.io/',
      domain: 'n8n.io',
    },
  },
  { match: '秘塔', hook: '中文搜索型回答' },
];

export const NEW_LISTINGS: { match: string; note: string; fallback?: ToolItem }[] = [
  { match: 'LibTV', note: '视频创作向，关注性价比' },
  { match: 'updream', note: '长视频工作流' },
  { match: 'OpenClaw', note: '个人电脑 Agent' },
  { match: 'Seko', note: '创编一体视频 Agent' },
  { match: 'Lovart', note: '设计 Agent' },
];

const allToolsCache: ToolItem[] = [];

export function allTools(): ToolItem[] {
  if (allToolsCache.length) return allToolsCache;
  const seen = new Set<string>();
  for (const t of [...RECOMMENDED, ...CATALOG.flatMap((c) => c.children.flatMap((s) => s.tools))]) {
    const k = `${t.name}|${t.domain}`;
    if (seen.has(k)) continue;
    seen.add(k);
    allToolsCache.push(t);
  }
  return allToolsCache;
}

export function findTool(match: string, fallback?: ToolItem): ToolItem | undefined {
  const m = match.toLowerCase();
  const list = allTools();
  const exact = list.find((t) => t.name.toLowerCase() === m);
  if (exact) return exact;
  const starts = list
    .filter((t) => t.name.toLowerCase().startsWith(m))
    .sort((a, b) => a.name.length - b.name.length);
  if (starts[0]) return starts[0];
  const includes = list
    .filter((t) => t.name.toLowerCase().includes(m))
    .sort((a, b) => a.name.length - b.name.length);
  if (includes[0]) return includes[0];
  return (
    list.find((t) => m.includes(t.name.toLowerCase()) && t.name.length > 2) || fallback
  );
}

export function toolSlug(tool: ToolItem): string {
  return encodeURIComponent(tool.name.trim());
}

export function findToolBySlug(slug: string): ToolItem | undefined {
  const name = decodeURIComponent(slug);
  return findTool(name) || allTools().find((t) => t.name === name);
}

export function resolvePick(pick: ScenePick): (ToolItem & { why: string }) | undefined {
  const tool = findTool(pick.match, pick.fallback);
  if (!tool) return undefined;
  return { ...tool, why: pick.why };
}

export function resolveSceneTools(sceneId: string): (ToolItem & { why: string })[] {
  const scene = SCENES.find((s) => s.id === sceneId);
  if (!scene) return [];
  return scene.picks.map(resolvePick).filter(Boolean) as (ToolItem & { why: string })[];
}

export function dayIndex(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function todaysPicks(count = 3): { tool: ToolItem; hook: string }[] {
  const idx = dayIndex();
  const out: { tool: ToolItem; hook: string }[] = [];
  for (let i = 0; i < DAILY_TRY_POOL.length && out.length < count; i++) {
    const item = DAILY_TRY_POOL[(idx + i) % DAILY_TRY_POOL.length];
    const tool = findTool(item.match, item.fallback);
    if (!tool) continue;
    if (out.some((x) => x.tool.name === tool.name)) continue;
    out.push({ tool, hook: item.hook });
  }
  return out;
}

export function todaysNewListings(count = 3): { tool: ToolItem; note: string }[] {
  const idx = dayIndex();
  const out: { tool: ToolItem; note: string }[] = [];
  for (let i = 0; i < NEW_LISTINGS.length && out.length < count; i++) {
    const item = NEW_LISTINGS[(idx + i * 2) % NEW_LISTINGS.length];
    const tool = findTool(item.match, item.fallback);
    if (!tool) continue;
    if (out.some((x) => x.tool.name === tool.name)) continue;
    out.push({ tool, note: item.note });
  }
  return out;
}

export function alternativesFor(tool: ToolItem, limit = 4): ToolItem[] {
  const cat = CATALOG.find((c) =>
    c.children.some((s) => s.tools.some((t) => t.name === tool.name)),
  );
  const pool = cat ? cat.children.flatMap((s) => s.tools) : allTools();
  const preferred = RECOMMENDED.filter(
    (t) => t.name !== tool.name && pool.some((p) => p.name === t.name),
  );
  const rest = pool
    .filter((t) => t.name !== tool.name && !preferred.some((p) => p.name === t.name))
    .sort((a, b) => a.name.length - b.name.length);
  return [...preferred, ...rest].slice(0, limit);
}

export function categoryOf(tool: ToolItem): string {
  const cat = CATALOG.find((c) => c.children.some((s) => s.tools.some((t) => t.name === tool.name)));
  return cat ? `${cat.icon} ${cat.title}` : '精选工具';
}

export interface SubmitPayload {
  name: string;
  url: string;
  category: string;
  scene: string;
  reason: string;
  contact: string;
  at: string;
}

const SUBMIT_KEY = 'aibox.submissions';

export function loadSubmissions(): SubmitPayload[] {
  try {
    return JSON.parse(localStorage.getItem(SUBMIT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSubmission(payload: Omit<SubmitPayload, 'at'>): SubmitPayload {
  const row: SubmitPayload = { ...payload, at: new Date().toISOString() };
  const list = loadSubmissions();
  list.unshift(row);
  localStorage.setItem(SUBMIT_KEY, JSON.stringify(list.slice(0, 50)));
  return row;
}
