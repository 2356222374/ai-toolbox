# AI Box 产品与架构说明

## 产品定位

面向 AI 从业者与爱好者的**工具导航 + 资讯聚合门户**（交互对标虫盒类站点，内容原创）。

## 信息架构

1. **左侧导航**：一级栏目锚点（资讯 / 对话 / 绘画 / 视频 / 编程 Agent / MCP / 知识库 / 自动化 / 学习）
2. **顶区搜索**：站内过滤工具；可切换外链搜索引擎（Google / Bing / DuckDuckGo）
3. **最新资讯**：多来源卡片（HN / Reddit / 官方博客 RSS），每卡 Top N 标题
4. **常用推荐 + 分类工具墙**：带 Favicon 的外链卡片网格

## 技术架构

```
Browser (Vite SPA)
    │  /api/news
    ▼
Node Aggregator ──► 公开 RSS / HN Algolia / Reddit JSON
    │
    └── 内存缓存 10min，降低源站压力
```

## 合规原则

- **不爬取**微信公众号、需登录论坛等非公开接口
- 仅使用 **RSS / 公开 JSON API**
- 工具描述与收录为原创整理，不复制第三方导航站文案库

## 图标策略

工具卡片图标使用 `https://www.google.com/s2/favicons?domain={host}&sz=64`，失败时回退字母头像。
