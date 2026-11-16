# 多站导航逆向合并说明

## 目标站点

- https://spiderbox.cn/（AI 其他）
- https://ai-bot.cn/
- https://aishenqi.net/
- https://www.aigc.cn/
- https://feizhuke.com/

## REA 现状

本机 Node 为 `24.17.0`，REA（`rea-agents`）要求 `^24.22.1`（或 `^22.23.4` / `>=26.12.1`），CLI 会直接拒绝启动。

升级 Node 后可在 `D:\\soft\\pythonProject\\rea` 执行：

```bash
node scripts/rea.mjs --help
# 浏览器观察类命令见 docs/guides/web/browser-observation.md
```

## 本次做法（等价于 REA browser-observation）

1. 用浏览器打开各站，解析 Webstack / 内容卡片 DOM（`.url-card` / `article.sites-item`，优先 `data-url` 官方链）。
2. 原始 JSON 落入 `scripts/nav-scrapes/*.json`。
3. `node scripts/merge-nav-scrapes.mjs` 按栏目规则归类、按「规范化名称+域名」去重，生成 `src/data/tools.ts`。

重新合并：

```bash
node scripts/merge-nav-scrapes.mjs
```
