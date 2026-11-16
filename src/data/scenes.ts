/** 场景选型：少而精，降低决策成本（产品主入口） */

export interface ScenePick {
  /** 匹配站内工具名的关键字 */
  match: string;
  /** 场景下的一句话理由 */
  why: string;
  /** 可选：站内没有时的兜底外链 */
  fallback?: { name: string; url: string; domain: string; desc: string };
}

export interface Scene {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  audience: string;
  picks: ScenePick[];
}

export const SCENES: Scene[] = [
  {
    id: 'scene-writing',
    title: '写周报 / 公文 / 长文',
    icon: '✍️',
    blurb: '先定结构，再扩写润色；体制内与职场文案优先可审可控。',
    audience: '运营、职能、体制内',
    picks: [
      { match: 'DeepSeek', why: '推理强，适合提纲与改写' },
      { match: 'Kimi', why: '长文上下文友好' },
      { match: '蛙蛙写作', why: '小说/长内容创作向' },
      { match: '办公小浣熊', why: '办公文案与知识库' },
      { match: '笔灵', why: '模板多，论文/小说场景' },
      {
        match: 'Notion',
        why: '知识库写作一体',
        fallback: {
          name: 'Notion AI',
          url: 'https://www.notion.so/product/ai',
          domain: 'notion.so',
          desc: '文档与 AI 写作一体',
        },
      },
    ],
  },
  {
    id: 'scene-ppt',
    title: '一键做 PPT',
    icon: '📊',
    blurb: '大纲 → 版式 → 配图，少改模板就能交差。',
    audience: '咨询、销售、学生',
    picks: [
      { match: 'AiPPT', why: '中文 PPT 生成成熟' },
      { match: '讯飞智文', why: '一句话出文档/PPT' },
      { match: 'Loomy', why: '积分制，适合轻量生成' },
      { match: '扣子', why: '可搭工作流批量出片' },
      {
        match: 'WPS',
        why: '办公套件内嵌 AI',
        fallback: {
          name: 'WPS AI',
          url: 'https://ai.wps.cn/',
          domain: 'ai.wps.cn',
          desc: 'WPS 内嵌写作与 PPT',
        },
      },
      { match: 'ChatGPT', why: '先写讲稿与结构再导入' },
    ],
  },
  {
    id: 'scene-video',
    title: '剪短视频 / 漫剧',
    icon: '🎬',
    blurb: '文生视频与剪辑分家：先定分镜，再选生成或剪辑工具。',
    audience: '创作者、电商',
    picks: [
      { match: '即梦', why: '图/视频一体，国内易用' },
      { match: '可灵', why: '电影感视频生成' },
      { match: 'LibTV', why: '性价比视频创作向' },
      { match: 'updream', why: '长视频/节点工作流' },
      { match: 'Seko', why: '创编一体 Agent' },
      {
        match: 'Runway',
        why: '海外成片与特效',
        fallback: {
          name: 'Runway',
          url: 'https://runwayml.com/',
          domain: 'runwayml.com',
          desc: '视频生成与剪辑',
        },
      },
    ],
  },
  {
    id: 'scene-coding',
    title: 'AI 写代码',
    icon: '💻',
    blurb: 'IDE Agent 优先；终端 Agent 适合仓库级改造。',
    audience: '开发者',
    picks: [
      { match: 'Cursor', why: 'AI 原生编辑器，默认首选' },
      { match: 'Claude Code', why: '终端仓库级代理' },
      { match: 'Codex', why: 'OpenAI 编码代理' },
      { match: 'Trae', why: '国产 AI IDE' },
      { match: 'TRAE', why: '字节系编程助手' },
      { match: 'Copilot', why: 'GitHub 生态补全' },
    ],
  },
  {
    id: 'scene-agent',
    title: '找 Agent / 自动化',
    icon: '🤖',
    blurb: '能调用工具、跑流程的才叫 Agent；先工作流后多智能体。',
    audience: '效率控、自动化',
    picks: [
      {
        match: 'n8n',
        why: '开源工作流，可自托管',
        fallback: {
          name: 'n8n',
          url: 'https://n8n.io/',
          domain: 'n8n.io',
          desc: '开源工作流自动化',
        },
      },
      { match: '扣子', why: 'Bot / Agent 搭建平台' },
      { match: 'Loomy', why: '桌面端智能体' },
      { match: 'Dify', why: 'LLM 应用与知识库' },
      { match: '讯飞星辰', why: '智能体开发平台' },
      { match: 'OpenClaw', why: '个人电脑 Agent' },
    ],
  },
  {
    id: 'scene-research',
    title: '论文 / 学术阅读',
    icon: '📚',
    blurb: '读论文要「定位段落 + 解释公式」，写作要控查重与结构。',
    audience: '学生、研究员',
    picks: [
      {
        match: 'SciSpace',
        why: '论文交互问答',
        fallback: {
          name: 'SciSpace',
          url: 'https://typeset.io/',
          domain: 'typeset.io',
          desc: '论文阅读与解释',
        },
      },
      {
        match: 'NotebookLM',
        why: '资料包 → 提纲/播客',
        fallback: {
          name: 'NotebookLM',
          url: 'https://notebooklm.google/',
          domain: 'notebooklm.google',
          desc: '基于资料的研究助手',
        },
      },
      { match: 'ChatDOC', why: '文档定位与摘要' },
      { match: 'ChatPDF', why: 'PDF 对话入门' },
      { match: 'Kimi', why: '长文献上下文' },
      { match: 'ExplainPaper', why: '难句解释' },
    ],
  },
  {
    id: 'scene-design',
    title: '画画 / 设计出图',
    icon: '🎨',
    blurb: '先定风格与用途（电商/插画/消除），再选模型。',
    audience: '设计、电商运营',
    picks: [
      { match: '即梦', why: '免费向国内生图' },
      { match: 'Lovart', why: '设计 Agent，批量出图' },
      { match: 'Liblib', why: '模型社区与创作' },
      { match: '稿定', why: '消除/设计工具集' },
      {
        match: 'Midjourney',
        why: '社区风格文生图',
        fallback: {
          name: 'Midjourney',
          url: 'https://www.midjourney.com/',
          domain: 'midjourney.com',
          desc: '高质量社区文生图',
        },
      },
      { match: '美图设计室', why: '设计室工作流' },
    ],
  },
  {
    id: 'scene-search',
    title: '联网搜索问答',
    icon: '🔍',
    blurb: '要出处就选搜索型；要推理就选对话型再打开联网。',
    audience: '调研、产品',
    picks: [
      { match: 'Perplexity', why: '带引用的回答' },
      { match: '秘塔', why: '国内搜索向' },
      { match: '夸克', why: '搜索+网盘+文档' },
      { match: 'ChatGPT', why: '通用 + 浏览' },
      { match: '元宝', why: '腾讯生态搜索' },
      { match: 'Gemini', why: '多模态与搜索整合' },
    ],
  },
];
