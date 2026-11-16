import fs from 'fs';

const sourcePath = process.argv[2];
const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const short = (s, n = 72) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);

const cats = [
  ['chat', 'AI 文本对话', '💬'],
  ['coding', 'AI 代码编程', '💻'],
  ['image', 'AI 图像视频', '🎨'],
  ['audio', 'AI 音频音乐', '🎵'],
  ['avatar', 'AI 数字人', '🧍'],
  ['office', 'AI 文档办公', '📄'],
  ['agent', 'AI Agent', '🤖'],
  ['market', 'Skill/MCP 市场', '🧩'],
  ['other', 'AI 其他资源', '📦'],
];

const NAV = [
  { id: 'news', title: '最新资讯', icon: '📰' },
  { id: 'recommend', title: '常用推荐', icon: '⭐' },
  ...cats.map(([id, title, icon]) => ({ id, title, icon })),
];

function tool(t) {
  return {
    name: t.name,
    desc: short(t.desc) || t.name,
    url: t.url,
    domain: t.domain,
  };
}

const CATALOG = cats.map(([id, title, icon]) => ({
  id,
  title,
  icon,
  children: [
    {
      id: `${id}-all`,
      title,
      tools: (raw[title] || []).map(tool),
    },
  ],
}));

const byName = (list, names) => list.filter((x) => names.includes(x.name));

const RECOMMENDED = [
  ...raw['AI 文本对话'].slice(0, 4),
  ...raw['AI 代码编程'].slice(0, 2),
  ...byName(raw['AI 图像视频'], ['Midjourney', '可灵', 'Runway']),
  ...byName(raw['AI Agent'], ['n8n', '扣子']),
  ...raw['Skill/MCP 市场'].slice(0, 2),
].map(tool);

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

/** 侧栏：资讯 + 推荐 + 虫盒「AI 其他」全部栏目 */
export const NAV: { id: string; title: string; icon: string }[] = ${JSON.stringify(NAV, null, 2)};

/** 顶部胶囊筛选（对应 AI 其他子栏目） */
export const AI_TABS = NAV.filter((n) => !['news', 'recommend'].includes(n.id));

export const RECOMMENDED: ToolItem[] = ${JSON.stringify(RECOMMENDED, null, 2)};

export const CATALOG: Category[] = ${JSON.stringify(CATALOG, null, 2)};

export function faviconUrl(domain: string, size = 64): string {
  return \`https://www.google.com/s2/favicons?domain=\${encodeURIComponent(domain)}&sz=\${size}\`;
}
`;

fs.writeFileSync(new URL('../src/data/tools.ts', import.meta.url), file);
const total = CATALOG.reduce((n, c) => n + c.children[0].tools.length, 0);
console.log(`wrote tools.ts: ${total} tools, ${NAV.length} nav`);
