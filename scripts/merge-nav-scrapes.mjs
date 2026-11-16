import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scrapesDir = path.join(__dirname, 'nav-scrapes');
const spiderboxPath = path.join(__dirname, 'spiderbox-ai.json');

const short = (s, n = 72) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const normName = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/^荐/, '')
    .replace(/[·\-—_|].*$/, '')
    .replace(/\s+/g, '')
    .replace(/(官网|网页版|免费|最强|超强|神器|工具|平台|助手)$/g, '');

/** Map source category titles → our catalog ids */
const RULES = [
  { id: 'chat', title: 'AI 文本对话', icon: '💬', match: /文本对话|聊天|智能对话|对话助手|DeepSeek神器/i },
  { id: 'writing', title: 'AI 写作', icon: '✍️', match: /写作|论文|公文|小说|提示指令|Prompt/i },
  { id: 'coding', title: 'AI 代码编程', icon: '💻', match: /代码编程|编程|开发编程|CLI|IDE|开发框架/i },
  { id: 'image', title: 'AI 图像', icon: '🎨', match: /图像|绘画|图片|生图|插画|设计神器|商业设计|图像生成/i },
  { id: 'video', title: 'AI 视频', icon: '🎬', match: /视频|漫剧|数字人|影像/i },
  { id: 'audio', title: 'AI 音频音乐', icon: '🎵', match: /音频|音乐|配音|语音|TTS/i },
  { id: 'office', title: 'AI 文档办公', icon: '📄', match: /文档办公|办公|智慧办公|办公效率|PPT|幻灯|思维导图|表格/i },
  { id: 'agent', title: 'AI Agent', icon: '🤖', match: /Agent|智能体|自动化/i },
  { id: 'search', title: 'AI 搜索', icon: '🔍', match: /搜索/i },
  { id: 'design', title: 'AI 设计', icon: '🖌️', match: /设计工具|Logo|设计/i },
  { id: 'devplat', title: 'AI 开发平台', icon: '🛠️', match: /开发平台|开放平台|训练模型|大模型|api平台|算力|词元/i },
  { id: 'market', title: 'Skill/MCP 市场', icon: '🧩', match: /Skill\/MCP|MCP|Skills|插件/i },
  { id: 'learn', title: 'AI 学习资料', icon: '🎓', match: /学习|教程|评测|测评|认证|竞赛|资讯|社区/i },
  { id: 'detect', title: 'AI 内容检测', icon: '🛡️', match: /内容检测|降AI|AIGC率|检测/i },
  { id: 'other', title: 'AI 其他资源', icon: '📦', match: /其他|导航|副业|营销|求职|法律|生活|推荐|TOP|热门/i },
];

function classify(catTitle) {
  for (const r of RULES) {
    if (r.match.test(catTitle)) return r.id;
  }
  return 'other';
}

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function ingestSpiderbox(bucket) {
  const raw = loadJson(spiderboxPath);
  if (!raw) return;
  for (const [title, items] of Object.entries(raw)) {
    const id = classify(title);
    for (const t of items || []) addTool(bucket, id, t, 'spiderbox');
  }
}

function ingestScrape(file, bucket) {
  const data = loadJson(file);
  if (!data?.cats) return;
  const source = data.site || path.basename(file, '.json');
  for (const [title, items] of Object.entries(data.cats)) {
    const id = classify(title);
    for (const t of items || []) addTool(bucket, id, t, source);
  }
}

function addTool(bucket, id, t, source) {
  if (!t?.name || !t?.url) return;
  // skip pure intermediate pages without useful domain
  let url = t.url;
  let domain = t.domain || '';
  try {
    const u = new URL(url);
    domain = domain || u.hostname.replace(/^www\./, '');
    // feizhuke/ai-bot intermediate — keep if no better; prefer external
    if (/^(ai-bot\.cn|aishenqi\.net|feizhuke\.com|aigc\.cn)$/i.test(domain) && !t.url.includes('http')) {
      return;
    }
  } catch {
    return;
  }
  const key = `${normName(t.name)}|${domain}`;
  if (!bucket[id]) bucket[id] = new Map();
  const map = bucket[id];
  if (map.has(key)) {
    const prev = map.get(key);
    // prefer longer desc / external domain
    const better =
      (!/ai-bot\.cn|aishenqi|feizhuke|aigc\.cn/i.test(domain) &&
        /ai-bot\.cn|aishenqi|feizhuke|aigc\.cn/i.test(prev.domain)) ||
      (short(t.desc).length > short(prev.desc).length);
    if (better) {
      map.set(key, {
        name: t.name.replace(/^荐/, '').split(/[-—|]/)[0].trim().slice(0, 40),
        desc: short(t.desc) || short(prev.desc) || t.name,
        url,
        domain,
        sources: [...new Set([...(prev.sources || []), source])],
      });
    } else {
      prev.sources = [...new Set([...(prev.sources || []), source])];
    }
    return;
  }
  map.set(key, {
    name: t.name.replace(/^荐/, '').split(/[-—|]/)[0].trim().slice(0, 40),
    desc: short(t.desc) || t.name,
    url,
    domain,
    sources: [source],
  });
}

const bucket = {};
ingestSpiderbox(bucket);
for (const f of fs.readdirSync(scrapesDir).filter((x) => x.endsWith('.json'))) {
  ingestScrape(path.join(scrapesDir, f), bucket);
}

const NAV = [
  { id: 'news', title: '最新资讯', icon: '📰' },
  { id: 'recommend', title: '常用推荐', icon: '⭐' },
  ...RULES.map((r) => ({ id: r.id, title: r.title, icon: r.icon })),
];

const CATALOG = RULES.map((r) => {
  const tools = [...(bucket[r.id]?.values() || [])]
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    .slice(0, 60)
    .map(({ name, desc, url, domain }) => ({ name, desc, url, domain }));
  return {
    id: r.id,
    title: r.title,
    icon: r.icon,
    children: [{ id: `${r.id}-all`, title: r.title, tools }],
  };
}).filter((c) => c.children[0].tools.length);

const pick = (id, names) => {
  const tools = CATALOG.find((c) => c.id === id)?.children[0].tools || [];
  return tools.filter((t) => names.some((n) => t.name.includes(n)));
};

const RECOMMENDED = [
  ...pick('chat', ['ChatGPT', 'DeepSeek', 'Claude', '豆包', 'Kimi']),
  ...pick('coding', ['Cursor', 'Codex', 'Trae', 'TRAE']),
  ...pick('image', ['Midjourney', '即梦', '可灵']),
  ...pick('video', ['Runway', '可灵', '即梦', 'LibTV']),
  ...pick('agent', ['n8n', '扣子', 'Loomy']),
  ...pick('office', ['AiPPT', 'WPS', 'Notion']),
  ...pick('market', ['MCP', 'Skill']),
  ...pick('search', ['Perplexity', '秘塔', '夸克']),
]
  .filter((t, i, arr) => arr.findIndex((x) => x.name === t.name) === i)
  .slice(0, 18);

const total = CATALOG.reduce((n, c) => n + c.children[0].tools.length, 0);

const file = `export interface ToolItem {
  name: string;
  desc: string;
  url: string;
  domain: string;
  tags?: string[];
}

export interface SubCategory {
  id: string;
  title: string;
  tools: ToolItem[];
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  children: SubCategory[];
}

/** 侧栏：资讯 + 推荐 + 多站逆向合并后的 AI 栏目 */
export const NAV: { id: string; title: string; icon: string }[] = ${JSON.stringify(NAV, null, 2)};

/** 顶部胶囊筛选 */
export const AI_TABS = NAV.filter((n) => !['news', 'recommend'].includes(n.id));

export const RECOMMENDED: ToolItem[] = ${JSON.stringify(RECOMMENDED, null, 2)};

export const CATALOG: Category[] = ${JSON.stringify(CATALOG, null, 2)};

export const CATALOG_META = {
  totalTools: ${total},
  sources: ['spiderbox.cn', 'ai-bot.cn', 'aishenqi.net', 'aigc.cn', 'feizhuke.com'],
  generatedAt: '${new Date().toISOString()}',
  note: 'REA CLI 需 Node >=24.22.1；本次用浏览器 DOM 逆向（同 REA browser-observation 思路）合并去重',
};

export function faviconUrl(domain: string, size = 64): string {
  return \`https://www.google.com/s2/favicons?domain=\${encodeURIComponent(domain)}&sz=\${size}\`;
}
`;

fs.writeFileSync(path.join(__dirname, '../src/data/tools.ts'), file);
fs.writeFileSync(
  path.join(__dirname, 'merge-report.json'),
  JSON.stringify(
    {
      total,
      perCat: Object.fromEntries(CATALOG.map((c) => [c.id, c.children[0].tools.length])),
      sources: CATALOG_META_SOURCES(),
    },
    null,
    2,
  ),
);

function CATALOG_META_SOURCES() {
  return ['spiderbox.cn', 'ai-bot.cn', 'aishenqi.net', 'aigc.cn', 'feizhuke.com'];
}

console.log(`merged ${total} tools across ${CATALOG.length} categories`);
for (const c of CATALOG) console.log(`  ${c.title}: ${c.children[0].tools.length}`);
