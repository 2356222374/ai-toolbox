# AI Box

场景选型 · 每日精选 · AI 工具导航 · 资讯聚合 · GitHub 周榜

## 本地开发

```bash
npm install
npm run api   # http://127.0.0.1:5181
npm run dev   # http://127.0.0.1:5180  （/api 代理到 5181）
```

可选环境变量：`GITHUB_TOKEN`（提高 GitHub 周榜请求限额）

## 生产启动（Render / 单进程）

```bash
npm ci
npm run build
npm start     # 托管 dist + /api ，监听 PORT
```

## 部署到 Render

1. 把本仓库推送到 GitHub
2. 打开 [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. 选择本仓库（根目录有 `render.yaml`）
4. 创建服务后开启 **Auto-Deploy**（Blueprint 已设 `autoDeployTrigger: commit`）
5. 可选：在 Environment 填入 `GITHUB_TOKEN`

部署完成后访问 `https://ai-box-xxxx.onrender.com`。

Free 实例闲置会休眠，首次访问可能需等待约 50 秒。
