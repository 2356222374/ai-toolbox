import { SCENES } from './data/scenes';
import {
  CURATION_STANDARDS,
  PRODUCT_NAV,
  alternativesFor,
  categoryOf,
  findToolBySlug,
  loadSubmissions,
  resolveSceneTools,
  saveSubmission,
  todaysNewListings,
  todaysPicks,
  toolSlug,
} from './data/product';
import {
  AI_TABS,
  CATALOG,
  RECOMMENDED,
  faviconUrl,
  type ToolItem,
} from './data/tools';

const API_CANDIDATES = [
  import.meta.env.VITE_API_BASE || '',
  'http://127.0.0.1:5181',
].filter((v, i, arr) => arr.indexOf(v) === i);

const sidebar = document.getElementById('sidebar')!;
const catalog = document.getElementById('catalog')!;
const recommendGrid = document.getElementById('recommendGrid')!;
const newsGrid = document.getElementById('newsGrid')!;
const newsHint = document.getElementById('newsHint')!;
const githubRoot = document.getElementById('githubRoot')!;
const githubHint = document.getElementById('githubHint')!;
const dailyRoot = document.getElementById('dailyRoot')!;
const dailyHint = document.getElementById('dailyHint')!;
const scenesRoot = document.getElementById('scenesRoot')!;
const standardsRoot = document.getElementById('standardsRoot')!;
const submitRoot = document.getElementById('submitRoot')!;
const toolDetail = document.getElementById('toolDetail')!;
const browseView = document.getElementById('browseView')!;
const search = document.getElementById('search') as HTMLInputElement;
const searchForm = document.getElementById('searchForm') as HTMLFormElement;
const searchTabs = document.getElementById('searchTabs')!;
const clock = document.getElementById('clock')!;
const themeToggle = document.getElementById('themeToggle');
const refreshNews = document.getElementById('refreshNews') as HTMLButtonElement;
const refreshGithub = document.getElementById('refreshGithub') as HTMLButtonElement;

type ThemeMode = 'light' | 'dark';
let themeMode: ThemeMode =
  (document.documentElement.getAttribute('data-theme') as ThemeMode) ||
  (localStorage.getItem('aibox.theme') as ThemeMode) ||
  'light';

function applyTheme(mode: ThemeMode): void {
  themeMode = mode === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', themeMode);
  localStorage.setItem('aibox.theme', themeMode);
  themeToggle?.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === themeMode);
  });
}

type NewsLangMode = 'zh' | 'en' | 'bi';
type NewsItem = {
  title: string;
  titleZh?: string;
  titleEn?: string;
  url: string;
  author?: string;
};
type NewsSource = {
  name: string;
  icon: string;
  color: string;
  items: NewsItem[];
  fetchedAt: string;
};

let searchMode: 'site' | 'google' | 'bing' | 'ddg' = 'site';
let activeAiTab = AI_TABS[0]?.id || 'chat';
let activeScene = SCENES[0]?.id || 'scene-coding';
let newsLangMode: NewsLangMode =
  (localStorage.getItem('aibox.newsLang') as NewsLangMode) || 'bi';
let newsHeadlines: { title: string; titleZh?: string; titleEn?: string; url: string; source: string }[] = [];
let lastNewsSources: NewsSource[] = [];
let lastNewsMeta = { generatedAt: '', base: '' };

type GhTab = 'ranking' | 'newborn' | 'ai' | 'active';
type GhRepo = {
  rank: number;
  fullName: string;
  name: string;
  url: string;
  description: string;
  descriptionZh?: string;
  descriptionEn?: string;
  intro: string;
  introZh?: string;
  introEn?: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  owner: string;
  ownerAvatar: string;
  bucket: string;
  homepage?: string;
};
type GhPayload = {
  generatedAt: string;
  weekStart?: string;
  total?: number;
  errors?: string[];
  degraded?: boolean;
  ranking: GhRepo[];
  sections: { newborn: GhRepo[]; ai: GhRepo[]; active: GhRepo[] };
};
let ghTab: GhTab = (localStorage.getItem('aibox.ghTab') as GhTab) || 'ranking';
let lastGh: GhPayload | null = null;
let lastGhMetaBase = '(proxy)';

function iconImg(domain: string, name: string): string {
  const src = faviconUrl(domain, 64);
  const letter = name.slice(0, 1).toUpperCase();
  return `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'avatar\\'>${letter}</div>'" />`;
}

function toolCard(tool: ToolItem, extra = ''): string {
  const tip = escapeHtml(tool.desc);
  return `
    <a class="tool-card" href="#tool/${toolSlug(tool)}" title="${tip}">
      ${iconImg(tool.domain, tool.name)}
      <div>
        <div class="name">${escapeHtml(tool.name)}</div>
        <div class="desc">${escapeHtml(extra || tool.desc)}</div>
      </div>
      <div class="arrow">›</div>
      <div class="tip">${escapeHtml(tool.desc)}</div>
    </a>`;
}

function renderSidebar(): void {
  const catalogNav = AI_TABS.map((n) => ({ ...n, group: 'catalog' as const }));
  const items = [...PRODUCT_NAV, ...catalogNav];
  sidebar.innerHTML = `
    <div class="side-brand">
      <div class="mark-sm">AI</div>
      <div>
        <strong>AI Box</strong>
        <span>场景 · 日更 · 导航</span>
      </div>
    </div>
    <div class="nav-label">产品</div>
    ${PRODUCT_NAV.map(
      (n) => `
      <a class="nav-item" href="#${n.id}" data-id="${n.id}">
        <span class="ico">${n.icon}</span>
        <span class="label">${n.title}</span>
      </a>`,
    ).join('')}
    <div class="nav-label">工具目录</div>
    ${catalogNav
      .map(
        (n) => `
      <a class="nav-item nested" href="#${n.id}" data-id="${n.id}">
        <span class="ico">${n.icon}</span>
        <span class="label">${n.title}</span>
      </a>`,
      )
      .join('')}`;
  void items;
}

function titleHtml(item: { title: string; titleZh?: string; titleEn?: string }, mode = newsLangMode): string {
  const zh = item.titleZh || item.title;
  const en = item.titleEn || item.title;
  if (mode === 'zh') return escapeHtml(zh);
  if (mode === 'en') return escapeHtml(en);
  if (zh === en) return escapeHtml(zh);
  return `<span class="t-zh">${escapeHtml(zh)}</span><span class="t-en">${escapeHtml(en)}</span>`;
}

function syncNewsLangToggle(): void {
  document.querySelectorAll('#newsLangToggle .lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === newsLangMode);
  });
}

function renderNewsSources(sources: NewsSource[], generatedAt: string, base: string): void {
  lastNewsSources = sources;
  lastNewsMeta = { generatedAt, base };
  newsGrid.innerHTML = sources
    .slice(0, 4)
    .map(
      (s) => `
        <article class="news-card" style="--src:${s.color || '#7c3aed'}">
          <div class="news-card-head">
            <img src="${s.icon}" alt="" onerror="this.style.visibility='hidden'" />
            <strong>${escapeHtml(s.name)}</strong>
            <span class="badge">LIVE</span>
          </div>
          <ol class="news-list ${newsLangMode === 'bi' ? 'is-bi' : ''}">
            ${s.items
              .slice(0, 8)
              .map(
                (item, i) => `
              <li>
                <span class="idx">${i + 1}</span>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">${titleHtml(item)}</a>
                <span class="author">${escapeHtml(item.author || '')}</span>
              </li>`,
              )
              .join('')}
          </ol>
          <div class="news-foot">最近抓取 ${formatTime(s.fetchedAt || generatedAt)}</div>
        </article>`,
    )
    .join('');
  const modeLabel = newsLangMode === 'bi' ? '双语' : newsLangMode === 'zh' ? '中文' : 'EN';
  newsHint.textContent = `已更新 ${formatTime(generatedAt)} · ${base} · ${modeLabel}`;
  syncNewsLangToggle();
}

function renderDaily(): void {
  const tries = todaysPicks(3);
  const news = newsHeadlines.slice(0, 5);
  const newsings = todaysNewListings(3);
  const date = new Date();
  dailyHint.textContent = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} · 日更回访`;

  dailyRoot.innerHTML = `
    <div class="daily-grid">
      <article class="daily-panel">
        <div class="daily-panel-head">
          <h3>今日值得试</h3>
          <span class="chip">精选 ${tries.length}</span>
        </div>
        <div class="daily-list">
          ${tries
            .map(
              (p, i) => `
            <a class="daily-item has-idx" href="#tool/${toolSlug(p.tool)}">
              <span class="idx">${i + 1}</span>
              ${iconImg(p.tool.domain, p.tool.name)}
              <div>
                <strong>${escapeHtml(p.tool.name)}</strong>
                <p>${escapeHtml(p.hook)}</p>
              </div>
            </a>`,
            )
            .join('') || '<div class="hint">暂无精选</div>'}
        </div>
      </article>

      <article class="daily-panel">
        <div class="daily-panel-head">
          <h3>今日资讯精选</h3>
          <a class="chip linkish" href="#news">全部资讯</a>
        </div>
        <ol class="daily-news ${newsLangMode === 'bi' ? 'is-bi' : ''}">
          ${
            news
              .map(
                (n) => `
            <li>
              <a href="${n.url}" target="_blank" rel="noopener noreferrer">${titleHtml(n)}</a>
              <span>${escapeHtml(n.source)}</span>
            </li>`,
              )
              .join('') || '<li class="hint">资讯加载中或 API 未启动</li>'
          }
        </ol>
      </article>

      <article class="daily-panel">
        <div class="daily-panel-head">
          <h3>新收录 / 值得关注</h3>
          <span class="chip">编辑观察</span>
        </div>
        <div class="daily-list">
          ${newsings
            .map(
              (p) => `
            <a class="daily-item" href="#tool/${toolSlug(p.tool)}">
              ${iconImg(p.tool.domain, p.tool.name)}
              <div>
                <strong>${escapeHtml(p.tool.name)}</strong>
                <p>${escapeHtml(p.note)}</p>
              </div>
            </a>`,
            )
            .join('')}
        </div>
        <div class="sponsor-slot">
          <span class="sponsor-tag">赞助位预留</span>
          <p>品牌合作 / CPS 位将独立展示，不与精选混排。</p>
        </div>
      </article>
    </div>`;
}

function renderScenes(): void {
  const scene = SCENES.find((s) => s.id === activeScene) || SCENES[0];
  const picks = resolveSceneTools(scene.id);

  scenesRoot.innerHTML = `
    <div class="scene-tabs" id="sceneTabs">
      ${SCENES.map(
        (s) => `
        <button type="button" class="scene-tab${s.id === activeScene ? ' active' : ''}" data-id="${s.id}">
          <span>${s.icon}</span>
          <strong>${escapeHtml(s.title)}</strong>
          <em>${escapeHtml(s.audience)}</em>
        </button>`,
      ).join('')}
    </div>
    <div class="scene-board" id="${scene.id}">
      <div class="scene-intro">
        <h3>${scene.icon} ${escapeHtml(scene.title)}</h3>
        <p>${escapeHtml(scene.blurb)}</p>
        <span class="hint">面向：${escapeHtml(scene.audience)} · ${picks.length} 个精选</span>
      </div>
      <div class="scene-picks">
        ${picks
          .map(
            (t) => `
          <a class="scene-card" href="#tool/${toolSlug(t)}">
            ${iconImg(t.domain, t.name)}
            <div>
              <div class="name">${escapeHtml(t.name)}</div>
              <div class="why">${escapeHtml(t.why)}</div>
              <div class="desc">${escapeHtml(t.desc)}</div>
            </div>
            <span class="arrow">详情</span>
          </a>`,
          )
          .join('') || '<div class="hint">该场景暂无匹配到站内工具</div>'}
      </div>
    </div>`;

  document.getElementById('sceneTabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button.scene-tab') as HTMLButtonElement | null;
    if (!btn?.dataset.id) return;
    activeScene = btn.dataset.id;
    location.hash = activeScene;
    renderScenes();
    highlightNav();
  });
}

function renderStandards(): void {
  standardsRoot.innerHTML = `
    <div class="standards-grid">
      ${CURATION_STANDARDS.map(
        (s, i) => `
        <article class="standard-card">
          <span class="idx">${i + 1}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.desc)}</p>
        </article>`,
      ).join('')}
    </div>`;
}

function renderSubmit(): void {
  const recent = loadSubmissions().slice(0, 5);
  submitRoot.innerHTML = `
    <div class="submit-layout">
      <form class="submit-form" id="submitForm">
        <label>工具名称<input name="name" required placeholder="例如：Cursor" /></label>
        <label>官网链接<input name="url" type="url" required placeholder="https://" /></label>
        <label>建议分类
          <select name="category">
            ${AI_TABS.map((t) => `<option value="${t.id}">${t.title}</option>`).join('')}
          </select>
        </label>
        <label>关联场景
          <select name="scene">
            <option value="">不指定</option>
            ${SCENES.map((s) => `<option value="${s.id}">${s.title}</option>`).join('')}
          </select>
        </label>
        <label>推荐理由<textarea name="reason" rows="3" required placeholder="适合谁？解决什么问题？"></textarea></label>
        <label>联系方式（选填）<input name="contact" placeholder="邮箱 / 微信" /></label>
        <button type="submit">提交待审核</button>
        <p class="hint">提交保存在本机浏览器，后续可对接运营后台审核上架。</p>
      </form>
      <div class="submit-side">
        <h3>最近提交</h3>
        <ul class="submit-list" id="submitList">
          ${
            recent
              .map(
                (r) => `
            <li>
              <strong>${escapeHtml(r.name)}</strong>
              <span>${escapeHtml(r.category)} · ${formatTime(r.at)}</span>
            </li>`,
              )
              .join('') || '<li class="hint">还没有提交</li>'
          }
        </ul>
      </div>
    </div>`;

  document.getElementById('submitForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    saveSubmission({
      name: String(fd.get('name') || ''),
      url: String(fd.get('url') || ''),
      category: String(fd.get('category') || ''),
      scene: String(fd.get('scene') || ''),
      reason: String(fd.get('reason') || ''),
      contact: String(fd.get('contact') || ''),
    });
    form.reset();
    renderSubmit();
  });
}

function renderRecommend(q = ''): void {
  const list = RECOMMENDED.filter((t) => match(t, q));
  recommendGrid.innerHTML = list.map((t) => toolCard(t)).join('') || '<div class="hint">无匹配推荐</div>';
}

function renderAiPills(): string {
  return `
    <div class="ai-pills" id="aiPills">
      ${AI_TABS.map(
        (t) => `
        <button type="button" class="pill${t.id === activeAiTab ? ' active' : ''}" data-id="${t.id}">
          ${t.icon} ${t.title}
        </button>`,
      ).join('')}
    </div>`;
}

function renderCatalog(q = ''): void {
  const query = q.trim().toLowerCase();
  const searching = Boolean(query);

  if (searching) {
    catalog.innerHTML = CATALOG.map((cat) => {
      const tools = cat.children.flatMap((s) => s.tools).filter((t) => match(t, query));
      if (!tools.length) return '';
      return `
        <section class="section" id="${cat.id}">
          <div class="section-head">
            <h2>${cat.icon} ${cat.title}</h2>
            <span class="hint">${tools.length} 个工具</span>
          </div>
          <div class="tool-grid">${tools.map((t) => toolCard(t)).join('')}</div>
        </section>`;
    }).join('');
    return;
  }

  const cat = CATALOG.find((c) => c.id === activeAiTab) || CATALOG[0];
  const tools = cat.children.flatMap((s) => s.tools);
  catalog.innerHTML = `
    <section class="section ai-hub" id="ai-hub">
      <div class="section-head">
        <h2>AI 工具目录</h2>
        <span class="hint">完整目录 · 当前分类 ${tools.length} 个</span>
      </div>
      ${renderAiPills()}
      <div class="tool-grid" id="aiGrid">${tools.map((t) => toolCard(t)).join('')}</div>
    </section>
    ${CATALOG.map(
      (c) => `
      <section class="section" id="${c.id}">
        <div class="section-head">
          <h2>${c.icon} ${c.title}</h2>
          <span class="hint">${c.children[0].tools.length} 个工具</span>
        </div>
        <div class="tool-grid">${c.children[0].tools.map((t) => toolCard(t)).join('')}</div>
      </section>`,
    ).join('')}`;

  document.getElementById('aiPills')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button.pill') as HTMLButtonElement | null;
    if (!btn?.dataset.id) return;
    activeAiTab = btn.dataset.id;
    location.hash = activeAiTab;
    refreshBrowse();
  });
}

function renderToolDetail(slug: string): void {
  const tool = findToolBySlug(slug);
  browseView.hidden = true;
  toolDetail.hidden = false;

  if (!tool) {
    toolDetail.innerHTML = `
      <div class="section-head">
        <h2>未找到工具</h2>
        <a class="chip linkish" href="#scenes">返回场景选型</a>
      </div>
      <p class="hint">链接可能已失效，请从场景或目录重新进入。</p>`;
    return;
  }

  const alts = alternativesFor(tool);
  toolDetail.innerHTML = `
    <div class="detail-card">
      <a class="back-link" href="#scenes">← 返回</a>
      <div class="detail-hero">
        ${iconImg(tool.domain, tool.name)}
        <div>
          <div class="detail-cat">${escapeHtml(categoryOf(tool))}</div>
          <h2>${escapeHtml(tool.name)}</h2>
          <p>${escapeHtml(tool.desc)}</p>
        </div>
      </div>
      <div class="detail-actions">
        <a class="btn-primary" href="${tool.url}" target="_blank" rel="noopener noreferrer">访问官网</a>
        <a class="btn-ghost" href="#submit">纠错 / 补充收录</a>
      </div>
      <div class="detail-meta">
        <div><span>域名</span><strong>${escapeHtml(tool.domain)}</strong></div>
        <div><span>定位</span><strong>编辑可验证外链</strong></div>
        <div><span>广告</span><strong>本页无混排赞助</strong></div>
      </div>
      <h3>替代选择</h3>
      <div class="tool-grid detail-alts">
        ${alts.map((t) => toolCard(t)).join('') || '<div class="hint">暂无替代</div>'}
      </div>
      <div class="sponsor-slot detail-sponsor">
        <span class="sponsor-tag">合作咨询</span>
        <p>工具认证收录 / 分类冠名请走独立商务位，不占用精选排序。</p>
      </div>
    </div>`;
}

function showBrowse(): void {
  toolDetail.hidden = true;
  browseView.hidden = false;
}

function match(tool: ToolItem, q: string): boolean {
  if (!q) return true;
  const hay = `${tool.name} ${tool.desc} ${(tool.tags ?? []).join(' ')}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function highlightNav(): void {
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || 'daily';
  const id = hash.startsWith('tool/') ? 'scenes' : hash;
  sidebar.querySelectorAll('.nav-item').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('data-id') === id);
  });
}

function tickClock(): void {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  clock.innerHTML = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}<br/>${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

async function fetchNews(force: boolean) {
  let lastErr = 'unknown';
  for (const base of API_CANDIDATES) {
    try {
      const res = await fetch(`${base}/api/news${force ? '?refresh=1' : ''}`);
      if (!res.ok) {
        lastErr = `API ${res.status}`;
        continue;
      }
      return { ok: true as const, data: await res.json(), base: base || '(proxy)' };
    } catch (error) {
      lastErr = String(error);
    }
  }
  return { ok: false as const, error: lastErr };
}

async function fetchGithubWeekly(force: boolean) {
  let lastErr = 'unknown';
  for (const base of API_CANDIDATES) {
    try {
      const res = await fetch(`${base}/api/github-weekly${force ? '?refresh=1' : ''}`);
      if (!res.ok) {
        lastErr = `API ${res.status}`;
        continue;
      }
      return { ok: true as const, data: (await res.json()) as GhPayload, base: base || '(proxy)' };
    } catch (error) {
      lastErr = String(error);
    }
  }
  return { ok: false as const, error: lastErr };
}

function formatStars(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function syncGhTabToggle(): void {
  document.querySelectorAll('#ghTabToggle .lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === ghTab);
  });
}

function ghListForTab(data: GhPayload): GhRepo[] {
  if (ghTab === 'newborn') return data.sections?.newborn || [];
  if (ghTab === 'ai') return data.sections?.ai || [];
  if (ghTab === 'active') return data.sections?.active || [];
  return data.ranking || [];
}

function ghIntroHtml(r: GhRepo): string {
  const zh = r.introZh || r.descriptionZh || r.intro || r.description || '暂无简介';
  const en = r.introEn || r.descriptionEn || r.description || '';
  if (newsLangMode === 'zh') return escapeHtml(zh);
  if (newsLangMode === 'en') return escapeHtml(en || zh);
  // 双语：中文主摘要 + 英文原述
  const enShort = (r.descriptionEn || r.description || '').replace(/\s+/g, ' ').trim();
  return `<span class="t-zh">${escapeHtml(zh)}</span>${
    enShort && enShort !== zh ? `<span class="t-en">${escapeHtml(enShort)}</span>` : ''
  }`;
}

function renderGithub(data: GhPayload, base: string): void {
  lastGh = data;
  lastGhMetaBase = base;
  const list = ghListForTab(data);
  const tabLabel =
    ghTab === 'newborn' ? '本周新晋' : ghTab === 'ai' ? 'AI 相关' : ghTab === 'active' ? '高星活跃' : '综合';

  if (!list.length) {
    githubRoot.innerHTML = `<div class="hint">本周暂无数据${data.errors?.length ? `：${escapeHtml(data.errors.join('；'))}` : ''}</div>`;
    githubHint.textContent = '无数据';
    return;
  }

  githubRoot.innerHTML = `
    <ol class="gh-list">
      ${list
        .map(
          (r) => `
        <li class="gh-card">
          <div class="gh-rank">${r.rank}</div>
          <img class="gh-avatar" src="${escapeHtml(r.ownerAvatar || '')}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'" />
          <div class="gh-body">
            <div class="gh-title-row">
              <a class="gh-name" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.fullName || r.name)}</a>
              <span class="gh-bucket">${escapeHtml(r.bucket || tabLabel)}</span>
            </div>
            <p class="gh-intro ${newsLangMode === 'bi' ? 'is-bi' : ''}">${ghIntroHtml(r)}</p>
            <div class="gh-meta">
              <span>★ ${formatStars(r.stars || 0)}</span>
              <span>Fork ${formatStars(r.forks || 0)}</span>
              <span>${escapeHtml(r.language || 'Other')}</span>
              ${(r.topics || [])
                .slice(0, 3)
                .map((t) => `<span class="gh-topic">${escapeHtml(t)}</span>`)
                .join('')}
              ${r.homepage ? `<a class="gh-home" href="${escapeHtml(r.homepage)}" target="_blank" rel="noopener noreferrer">主页</a>` : ''}
            </div>
          </div>
        </li>`,
        )
        .join('')}
    </ol>`;

  const errNote = data.errors?.length ? ` · 部分源失败` : '';
  const week = data.weekStart ? `自 ${data.weekStart}` : '';
  const modeLabel = newsLangMode === 'bi' ? '双语摘要' : newsLangMode === 'zh' ? '中文摘要' : 'EN summary';
  githubHint.textContent = `${tabLabel} ${list.length} · ${modeLabel} · ${week} · 更新 ${formatTime(data.generatedAt)} · ${base}${errNote}`;
}

async function loadGithubWeekly(force = false): Promise<void> {
  githubHint.textContent = '拉取 GitHub 周榜…';
  githubRoot.innerHTML = `<div class="gh-skeleton"></div><div class="gh-skeleton"></div><div class="gh-skeleton"></div>`;
  try {
    const result = await fetchGithubWeekly(force);
    if (!result.ok) throw new Error(result.error || 'API unavailable');
    renderGithub(result.data, result.base);
  } catch (error) {
    githubRoot.innerHTML = `<div class="hint">GitHub 周榜服务未启动：${escapeHtml(String(error))}<br/>请运行 <code>npm run api</code></div>`;
    githubHint.textContent = 'API 不可用';
  }
}

async function loadNews(force = false): Promise<void> {
  newsHint.textContent = newsLangMode === 'en' ? 'Fetching…' : '拉取并翻译中…';
  try {
    const result = await fetchNews(force);
    if (!result.ok) throw new Error(result.error || 'API unavailable');
    const data = result.data;
    const sources = (data.sources || []).filter((s: { items?: unknown[] }) => (s.items?.length || 0) > 0) as NewsSource[];

    newsHeadlines = sources.flatMap((s) =>
      (s.items || []).slice(0, 3).map((item) => ({
        title: item.title,
        titleZh: item.titleZh,
        titleEn: item.titleEn,
        url: item.url,
        source: s.name,
      })),
    );
    renderDaily();

    if (!sources.length) {
      newsGrid.innerHTML = `<div class="hint">暂时没有可用资讯源，请稍后刷新</div>`;
      newsHint.textContent = '无数据';
      return;
    }
    renderNewsSources(sources, data.generatedAt, result.base + (data.bilingual ? ' · 已译' : ''));
  } catch (error) {
    newsGrid.innerHTML = `<div class="hint">新闻服务未启动：${escapeHtml(String(error))}<br/>请运行 <code>npm run api</code></div>`;
    newsHint.textContent = 'API 不可用';
    renderDaily();
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function refreshBrowse(): void {
  const q = searchMode === 'site' ? search.value : '';
  renderRecommend(q);
  renderCatalog(q);
  highlightNav();
}

function route(): void {
  const raw = decodeURIComponent(location.hash.replace(/^#/, '')) || 'daily';

  if (raw.startsWith('tool/')) {
    renderToolDetail(raw.slice(5));
    highlightNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  showBrowse();

  if (SCENES.some((s) => s.id === raw)) {
    activeScene = raw;
    renderScenes();
  }
  if (AI_TABS.some((t) => t.id === raw)) {
    activeAiTab = raw;
    refreshBrowse();
  }

  highlightNav();
  const el = document.getElementById(raw.startsWith('scene-') ? 'scenes' : raw);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

searchTabs.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button.tab') as HTMLButtonElement | null;
  if (!btn) return;
  searchMode = (btn.dataset.mode as typeof searchMode) || 'site';
  searchTabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = search.value.trim();
  if (searchMode === 'site') {
    showBrowse();
    refreshBrowse();
    document.getElementById('recommend')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const encoded = encodeURIComponent(q || 'AI tools');
  const map: Record<string, string> = {
    google: `https://www.google.com/search?q=${encoded}`,
    bing: `https://www.bing.com/search?q=${encoded}`,
    ddg: `https://duckduckgo.com/?q=${encoded}`,
  };
  window.open(map[searchMode], '_blank', 'noopener,noreferrer');
});

search.addEventListener('input', () => {
  if (searchMode === 'site') refreshBrowse();
});

themeToggle?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button[data-theme]') as HTMLButtonElement | null;
  if (!btn?.dataset.theme) return;
  applyTheme(btn.dataset.theme as ThemeMode);
});

refreshNews.addEventListener('click', () => void loadNews(true));
refreshGithub?.addEventListener('click', () => void loadGithubWeekly(true));

document.getElementById('newsLangToggle')?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button.lang-btn') as HTMLButtonElement | null;
  if (!btn?.dataset.lang) return;
  newsLangMode = btn.dataset.lang as NewsLangMode;
  localStorage.setItem('aibox.newsLang', newsLangMode);
  syncNewsLangToggle();
  if (lastNewsSources.length) {
    renderNewsSources(lastNewsSources, lastNewsMeta.generatedAt, lastNewsMeta.base);
  }
  renderDaily();
  if (lastGh) renderGithub(lastGh, lastGhMetaBase);
});

document.getElementById('ghTabToggle')?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button.lang-btn') as HTMLButtonElement | null;
  if (!btn?.dataset.tab) return;
  ghTab = btn.dataset.tab as GhTab;
  localStorage.setItem('aibox.ghTab', ghTab);
  syncGhTabToggle();
  if (lastGh) renderGithub(lastGh, lastGhMetaBase);
});

window.addEventListener('hashchange', route);

const initialHash = decodeURIComponent(location.hash.replace(/^#/, ''));
if (AI_TABS.some((t) => t.id === initialHash)) activeAiTab = initialHash;
if (SCENES.some((s) => s.id === initialHash)) activeScene = initialHash;

applyTheme(themeMode);
renderSidebar();
renderDaily();
renderScenes();
renderStandards();
renderSubmit();
refreshBrowse();
syncNewsLangToggle();
syncGhTabToggle();
route();
tickClock();
setInterval(tickClock, 1000);
void loadNews(false);
void loadGithubWeekly(false);
