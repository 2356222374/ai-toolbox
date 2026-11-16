export interface ToolItem {
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

export const NAV: { id: string; title: string; icon: string }[] = [
  { id: 'news', title: '最新资讯', icon: '📰' },
  { id: 'recommend', title: '常用推荐', icon: '⭐' },
  { id: 'chat', title: '对话模型', icon: '💬' },
  { id: 'image', title: '图像生成', icon: '🎨' },
  { id: 'video', title: '视频语音', icon: '🎬' },
  { id: 'coding', title: '编程 Agent', icon: '💻' },
  { id: 'agent', title: 'Agent / MCP', icon: '🤖' },
  { id: 'rag', title: '知识库 RAG', icon: '📚' },
  { id: 'auto', title: '自动化', icon: '⚡' },
  { id: 'learn', title: '学习资料', icon: '🎓' },
];

export const RECOMMENDED: ToolItem[] = [
  { name: 'ChatGPT', desc: 'OpenAI 通用对话与工具调用', url: 'https://chatgpt.com', domain: 'chatgpt.com', tags: ['对话'] },
  { name: 'Claude', desc: 'Anthropic 长上下文与写作', url: 'https://claude.ai', domain: 'claude.ai', tags: ['对话'] },
  { name: 'DeepSeek', desc: '深度求索推理与对话', url: 'https://chat.deepseek.com', domain: 'chat.deepseek.com', tags: ['推理'] },
  { name: 'Cursor', desc: 'AI 原生代码编辑器', url: 'https://cursor.com', domain: 'cursor.com', tags: ['编程'] },
  { name: 'Midjourney', desc: '高质量社区文生图', url: 'https://www.midjourney.com', domain: 'midjourney.com', tags: ['绘画'] },
  { name: 'Dify', desc: 'LLM 应用与知识库平台', url: 'https://dify.ai', domain: 'dify.ai', tags: ['RAG'] },
  { name: 'n8n', desc: '开源工作流自动化', url: 'https://n8n.io', domain: 'n8n.io', tags: ['自动化'] },
  { name: 'REA', desc: '逆向工程 MCP 与 Agent 工具', url: 'https://rea.tools', domain: 'rea.tools', tags: ['逆向'] },
  { name: 'Hugging Face', desc: '模型、数据集与 Spaces', url: 'https://huggingface.co', domain: 'huggingface.co', tags: ['开源'] },
  { name: 'OpenRouter', desc: '多模型统一 API 路由', url: 'https://openrouter.ai', domain: 'openrouter.ai', tags: ['API'] },
  { name: 'Perplexity', desc: '联网搜索型问答', url: 'https://www.perplexity.ai', domain: 'perplexity.ai', tags: ['搜索'] },
  { name: 'Notion AI', desc: '知识库写作助手', url: 'https://www.notion.so/product/ai', domain: 'notion.so', tags: ['效率'] },
];

export const CATALOG: Category[] = [
  {
    id: 'chat',
    title: '对话模型',
    icon: '💬',
    children: [
      {
        id: 'chat-web',
        title: '网页对话',
        tools: [
          { name: 'ChatGPT', desc: 'OpenAI 通用对话与工具调用', url: 'https://chatgpt.com', domain: 'chatgpt.com', tags: ['LLM'] },
          { name: 'Claude', desc: 'Anthropic 长上下文对话', url: 'https://claude.ai', domain: 'claude.ai', tags: ['LLM'] },
          { name: 'Gemini', desc: 'Google 多模态对话', url: 'https://gemini.google.com', domain: 'gemini.google.com', tags: ['多模态'] },
          { name: 'DeepSeek', desc: '深度求索对话与推理', url: 'https://chat.deepseek.com', domain: 'chat.deepseek.com', tags: ['推理'] },
          { name: 'Kimi', desc: '月之暗面长文本助手', url: 'https://kimi.moonshot.cn', domain: 'kimi.moonshot.cn', tags: ['长文本'] },
          { name: '通义千问', desc: '阿里云通义对话', url: 'https://tongyi.aliyun.com', domain: 'tongyi.aliyun.com', tags: ['国产'] },
          { name: '豆包', desc: '字节跳动对话助手', url: 'https://www.doubao.com', domain: 'doubao.com', tags: ['国产'] },
          { name: '文心一言', desc: '百度文心大模型', url: 'https://yiyan.baidu.com', domain: 'yiyan.baidu.com', tags: ['国产'] },
        ],
      },
      {
        id: 'chat-api',
        title: 'API / 开放平台',
        tools: [
          { name: 'OpenAI Platform', desc: 'GPT API 与生态文档', url: 'https://platform.openai.com', domain: 'platform.openai.com', tags: ['API'] },
          { name: 'OpenRouter', desc: '多模型统一路由', url: 'https://openrouter.ai', domain: 'openrouter.ai', tags: ['路由'] },
          { name: 'Together AI', desc: '开源模型托管推理', url: 'https://www.together.ai', domain: 'together.ai', tags: ['开源'] },
          { name: 'Groq', desc: '高速推理云', url: 'https://groq.com', domain: 'groq.com', tags: ['速度'] },
        ],
      },
    ],
  },
  {
    id: 'image',
    title: '图像生成',
    icon: '🎨',
    children: [
      {
        id: 'image-gen',
        title: '文生图 / 图生图',
        tools: [
          { name: 'Midjourney', desc: '社区风格文生图', url: 'https://www.midjourney.com', domain: 'midjourney.com', tags: ['绘画'] },
          { name: 'Flux', desc: '高质量开源文生图', url: 'https://blackforestlabs.ai', domain: 'blackforestlabs.ai', tags: ['开源'] },
          { name: 'Ideogram', desc: '擅长文字排版的生图', url: 'https://ideogram.ai', domain: 'ideogram.ai', tags: ['字体'] },
          { name: 'Leonardo', desc: '创作工作流与模型库', url: 'https://leonardo.ai', domain: 'leonardo.ai', tags: ['工作流'] },
          { name: 'Stable Diffusion', desc: 'Stability AI 开源生态', url: 'https://stability.ai', domain: 'stability.ai', tags: ['开源'] },
          { name: '即梦', desc: '字节图像创作', url: 'https://jimeng.jianying.com', domain: 'jimeng.jianying.com', tags: ['国产'] },
        ],
      },
    ],
  },
  {
    id: 'video',
    title: '视频语音',
    icon: '🎬',
    children: [
      {
        id: 'video-gen',
        title: '视频生成',
        tools: [
          { name: 'Runway', desc: '视频生成与剪辑', url: 'https://runwayml.com', domain: 'runwayml.com', tags: ['视频'] },
          { name: 'Kling', desc: '可灵 AI 视频', url: 'https://klingai.com', domain: 'klingai.com', tags: ['视频'] },
          { name: 'Luma', desc: 'Dream Machine 视频', url: 'https://lumalabs.ai/dream-machine', domain: 'lumalabs.ai', tags: ['视频'] },
          { name: 'Pika', desc: '创意视频生成', url: 'https://pika.art', domain: 'pika.art', tags: ['视频'] },
        ],
      },
      {
        id: 'voice',
        title: '语音',
        tools: [
          { name: 'ElevenLabs', desc: '语音合成与克隆', url: 'https://elevenlabs.io', domain: 'elevenlabs.io', tags: ['TTS'] },
          { name: 'Whisper', desc: '开源语音转写', url: 'https://github.com/openai/whisper', domain: 'github.com', tags: ['ASR'] },
          { name: 'Sunoh', desc: '音乐生成相关生态', url: 'https://suno.com', domain: 'suno.com', tags: ['音乐'] },
        ],
      },
    ],
  },
  {
    id: 'coding',
    title: '编程 Agent',
    icon: '💻',
    children: [
      {
        id: 'coding-ide',
        title: 'IDE / 编辑器',
        tools: [
          { name: 'Cursor', desc: 'AI 原生代码编辑器', url: 'https://cursor.com', domain: 'cursor.com', tags: ['IDE'] },
          { name: 'Windsurf', desc: 'Cascade 代理编程', url: 'https://codeium.com/windsurf', domain: 'codeium.com', tags: ['IDE'] },
          { name: 'GitHub Copilot', desc: 'GitHub 官方编程助手', url: 'https://github.com/features/copilot', domain: 'github.com', tags: ['补全'] },
          { name: 'Trae', desc: '字节 AI 编程 IDE', url: 'https://www.trae.ai', domain: 'trae.ai', tags: ['IDE'] },
        ],
      },
      {
        id: 'coding-cli',
        title: '终端 Agent',
        tools: [
          { name: 'Claude Code', desc: '终端里的编码代理', url: 'https://docs.anthropic.com/en/docs/claude-code', domain: 'anthropic.com', tags: ['CLI'] },
          { name: 'Aider', desc: 'Git 友好结对编程 CLI', url: 'https://aider.chat', domain: 'aider.chat', tags: ['CLI'] },
          { name: 'Codex CLI', desc: 'OpenAI 终端编码助手', url: 'https://github.com/openai/codex', domain: 'github.com', tags: ['CLI'] },
          { name: 'Continue', desc: '开源 IDE AI 插件', url: 'https://continue.dev', domain: 'continue.dev', tags: ['开源'] },
        ],
      },
    ],
  },
  {
    id: 'agent',
    title: 'Agent / MCP',
    icon: '🤖',
    children: [
      {
        id: 'agent-runtime',
        title: '运行时与编排',
        tools: [
          { name: 'LangGraph', desc: '有状态 Agent 图编排', url: 'https://langchain-ai.github.io/langgraph/', domain: 'langchain.com', tags: ['编排'] },
          { name: 'CrewAI', desc: '多智能体协作框架', url: 'https://www.crewai.com', domain: 'crewai.com', tags: ['多Agent'] },
          { name: 'AutoGen', desc: '微软多智能体框架', url: 'https://microsoft.github.io/autogen/', domain: 'microsoft.com', tags: ['多Agent'] },
          { name: 'DSH Super-agent', desc: 'DeepSeek Router/Worker 原型', url: 'https://github.com/deepseek-ai/dsh-superagent-prototype', domain: 'github.com', tags: ['调度'] },
        ],
      },
      {
        id: 'mcp',
        title: 'MCP 与工具协议',
        tools: [
          { name: 'Model Context Protocol', desc: 'MCP 规范与生态', url: 'https://modelcontextprotocol.io', domain: 'modelcontextprotocol.io', tags: ['MCP'] },
          { name: 'REA', desc: '逆向工程 MCP', url: 'https://rea.tools', domain: 'rea.tools', tags: ['逆向'] },
          { name: 'Playwright MCP', desc: '浏览器自动化 MCP', url: 'https://github.com/microsoft/playwright-mcp', domain: 'github.com', tags: ['浏览器'] },
        ],
      },
    ],
  },
  {
    id: 'rag',
    title: '知识库 RAG',
    icon: '📚',
    children: [
      {
        id: 'rag-tools',
        title: '检索增强',
        tools: [
          { name: 'Dify', desc: 'LLM 应用与知识库平台', url: 'https://dify.ai', domain: 'dify.ai', tags: ['平台'] },
          { name: 'FastGPT', desc: '知识库问答搭建', url: 'https://fastgpt.in', domain: 'fastgpt.in', tags: ['知识库'] },
          { name: 'LlamaIndex', desc: '数据框架与 RAG 管线', url: 'https://www.llamaindex.ai', domain: 'llamaindex.ai', tags: ['框架'] },
          { name: 'Chroma', desc: '轻量向量库', url: 'https://www.trychroma.com', domain: 'trychroma.com', tags: ['向量'] },
          { name: 'Milvus', desc: '云原生向量数据库', url: 'https://milvus.io', domain: 'milvus.io', tags: ['向量'] },
        ],
      },
    ],
  },
  {
    id: 'auto',
    title: '自动化',
    icon: '⚡',
    children: [
      {
        id: 'auto-workflow',
        title: '工作流',
        tools: [
          { name: 'n8n', desc: '开源工作流自动化', url: 'https://n8n.io', domain: 'n8n.io', tags: ['工作流'] },
          { name: 'Zapier', desc: 'SaaS 连接自动化', url: 'https://zapier.com', domain: 'zapier.com', tags: ['SaaS'] },
          { name: 'Make', desc: '可视化自动化', url: 'https://www.make.com', domain: 'make.com', tags: ['工作流'] },
          { name: 'Browser Use', desc: '浏览器 Agent 自动化', url: 'https://github.com/browser-use/browser-use', domain: 'github.com', tags: ['浏览器'] },
        ],
      },
    ],
  },
  {
    id: 'learn',
    title: '学习资料',
    icon: '🎓',
    children: [
      {
        id: 'learn-docs',
        title: '文档与课程',
        tools: [
          { name: 'Prompting Guide', desc: '提示工程系统指南', url: 'https://www.promptingguide.ai', domain: 'promptingguide.ai', tags: ['提示词'] },
          { name: 'HF Courses', desc: 'Hugging Face 开源课程', url: 'https://huggingface.co/learn', domain: 'huggingface.co', tags: ['课程'] },
          { name: 'Anthropic Learn', desc: '官方 API / Agent 课程', url: 'https://anthropic.skilljar.com', domain: 'anthropic.com', tags: ['课程'] },
          { name: 'DeepLearning.AI', desc: '吴恩达短课程', url: 'https://www.deeplearning.ai', domain: 'deeplearning.ai', tags: ['课程'] },
        ],
      },
    ],
  },
];

export function faviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** 侧栏/目录用的 AI 分类 Tab（与 CATALOG 对齐） */
export const AI_TABS = CATALOG.map((c) => ({ id: c.id, title: c.title, icon: c.icon }));
