# 旅行助手 - 架构设计文档

> 本文档描述项目的技术架构、目录结构、数据流和核心模块设计。

---

## 技术架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端 (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js 前端                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │   │
│  │  │ 聊天界面   │  │ 消息列表   │  │ 输入组件          │   │   │
│  │  │ (page.tsx)│  │(MessageList)│ │(ChatInput)       │   │   │
│  │  └───────────┘  └───────────┘  └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │ Supabase Client              │ HTTP POST /api/chat
         ▼                              ▼
┌─────────────────────┐   ┌─────────────────────────────────────┐
│   Supabase          │   │       Next.js API Routes             │
│  ┌───────────────┐  │   │  ┌─────────────────────────────┐   │
│  │ Auth          │  │   │  │     /api/chat/route.ts      │   │
│  │ (用户认证)    │  │   │  │  Prompt → LangChain → AI    │   │
│  ├───────────────┤  │   │  └─────────────────────────────┘   │
│  │ PostgreSQL    │  │   └─────────────────────────────────────┘
│  │ (会话/消息)   │  │                     │
│  │ + RLS 数据隔离│  │                     │ LangChain.js
│  └───────────────┘  │                     ▼
└─────────────────────┘   ┌─────────────────────────────────────┐
                          │            智谱 AI API               │
                          │         (GLM-4 / GLM-4-Flash)        │
                          └─────────────────────────────────────┘
```

---

## 目录结构

```
travel-assistant/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局（含 AuthProvider）
│   ├── page.tsx                # 首页（聊天主界面）
│   ├── globals.css             # 全局样式
│   ├── auth/                   # 认证页面（阶段 4）
│   │   ├── login/page.tsx      # 登录页
│   │   └── signup/page.tsx     # 注册页
│   └── api/                    # API 路由
│       └── chat/
│           └── route.ts        # 聊天 API 端点
├── middleware.ts               # Auth 中间件（阶段 4）
├── supabase/                   # 数据库迁移（阶段 4）
│   └── migrations/             # SQL 迁移脚本
│
├── components/                 # React 组件
│   ├── ui/                     # shadcn/ui 组件（自动生成）
│   ├── auth/                   # 认证组件（阶段 4）
│   │   ├── AuthProvider.tsx    # 认证上下文
│   │   └── UserMenu.tsx        # 用户菜单
│   ├── chat/                   # 聊天组件
│   │   ├── ChatLayout.tsx      # 聊天布局
│   │   ├── ChatArea.tsx        # 聊天区域
│   │   ├── Sidebar.tsx         # 侧边栏（含会话列表）
│   │   ├── MessageList.tsx     # 消息列表
│   │   └── ChatInput.tsx       # 输入框组件
│
├── lib/                        # 核心逻辑
│   ├── langchain/              # LangChain 相关
│   │   ├── model.ts            # 模型配置
│   │   ├── prompts.ts          # 提示词模板
│   │   ├── agent.ts            # ReAct Agent（阶段 3）
│   │   ├── chain.ts            # 链式调用（阶段 2+）
│   │   ├── tools/              # 本地工具（阶段 3）
│   │   ├── mcp-client.ts       # MCP 客户端（阶段 3）
│   │   └── rag/                # RAG 模块（阶段 5）
│   │       ├── embeddings.ts   # Embedding 配置
│   │       ├── loader.ts       # JSONL 加载器
│   │       ├── splitter.ts     # 文档切分器
│   │       ├── store.ts        # 向量存储
│   │       ├── retriever.ts    # 检索器
│   │       └── index.ts        # 统一导出
│   ├── supabase/               # Supabase 配置（阶段 4）
│   │   ├── client.ts           # 浏览器端客户端
│   │   ├── server.ts           # 服务端客户端
│   │   └── middleware.ts       # Auth 中间件
│   └── utils.ts                # 工具函数
│
├── store/                      # Zustand 状态管理
│   ├── chat-store.ts           # 聊天状态 Store
│   ├── session-store.ts        # 会话状态 Store（阶段 4）
│   └── index.ts                # 统一导出
│
├── types/                      # TypeScript 类型定义
│   └── index.ts                # 消息、请求、响应类型
│
├── .env.local                  # 环境变量（本地）
├── .env.example                # 环境变量示例
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json             # shadcn/ui 配置
│
├── .husky/                     # Git 钩子
│   ├── pre-commit              # 提交前检查
│   └── commit-msg              # 提交信息检查（可选）
│
├── .eslintrc.json              # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── .lintstagedrc               # lint-staged 配置
│
├── __tests__/                  # 测试文件
│   ├── lib/                    # 工具函数测试
│   └── components/             # 组件测试
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI 流程
│       └── deploy.yml          # 部署流程
│
├── openspec/                   # OpenSpec 规范驱动开发
│   ├── project.md              # 项目上下文
│   ├── specs/                  # 当前规范
│   │   └── chat-api.md         # 聊天 API 规范
│   └── changes/                # 变更提案
│
├── vitest.config.ts            # Vitest 配置
│
├── ROADMAP.md                  # 迭代规划
├── ARCHITECTURE.md             # 本文档
├── SPEC.md                     # 项目规范
├── CLAUDE.md                   # AI 协作指南
│
└── .cursor/
    ├── rules/
    │   └── project.mdc         # 项目规则
    └── skills/
        └── ui-ux-pro-max/      # UI/UX 设计智能（通过 CLI 安装）
```

---

## 核心模块设计

### 1. 前端组件层次

```
page.tsx (首页)
└── ChatInterface
    ├── MessageList
    │   └── MessageItem (循环渲染)
    │       ├── 用户消息样式
    │       └── AI 消息样式
    └── ChatInput
        ├── Textarea / Input
        └── Send Button
```

**组件职责：**

| 组件            | 职责                       | 状态管理            |
| --------------- | -------------------------- | ------------------- |
| `ChatInterface` | 聊天界面容器，管理消息状态 | messages, isLoading |
| `MessageList`   | 展示消息列表，自动滚动     | 无（接收 props）    |
| `MessageItem`   | 单条消息渲染               | 无（纯展示）        |
| `ChatInput`     | 用户输入，发送消息         | input value         |

### 2. API 层设计

**端点：** `POST /api/chat`

**请求体：**

```typescript
interface ChatRequest {
  messages: Message[]; // 对话历史
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

**响应体（阶段 1）：**

```typescript
interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
}
```

**响应体（阶段 2 - 流式）：**

```
Server-Sent Events (SSE)
data: {"content": "北"}
data: {"content": "京"}
data: {"content": "有"}
...
data: [DONE]
```

### 3. LangChain 模块

**model.ts - 模型配置**

```
职责：初始化智谱 AI 模型
导出：配置好的 ChatZhipuAI 实例
```

**prompts.ts - 提示词管理**

```
职责：定义和管理 System Prompt
导出：旅行助手的角色设定
```

**chain.ts - 链式调用（后续）**

```
职责：组合 Prompt + Model + Parser
导出：可调用的 Chain
```

---

## 数据流

### 阶段 1：基础对话流程

```
1. 用户输入消息
   │
   ▼
2. ChatInput 触发 onSubmit
   │
   ▼
3. ChatInterface 更新 messages 状态
   │  添加用户消息到数组
   │
   ▼
4. 调用 /api/chat
   │  请求体：{ messages: [...] }
   │
   ▼
5. API Route 处理
   │  a. 构造完整 Prompt（System + History + User）
   │  b. 调用 ChatZhipuAI.invoke()
   │  c. 返回 AI 回复
   │
   ▼
6. 前端接收响应
   │  更新 messages 状态
   │  添加 AI 消息到数组
   │
   ▼
7. MessageList 重新渲染
```

### 阶段 2：流式对话流程

```
1-4. 同上
   │
   ▼
5. API Route 处理
   │  a. 构造 Prompt
   │  b. 调用 ChatZhipuAI.stream()
   │  c. 返回 SSE 流
   │
   ▼
6. 前端流式接收
   │  逐 chunk 更新 AI 消息内容
   │
   ▼
7. MessageList 实时更新
```

---

## 状态管理

使用 **Zustand** 进行状态管理，为 Agent 阶段的复杂状态做好准备。

### Store 设计

```typescript
// store/chat-store.ts

interface ChatState {
  // 消息相关
  messages: Message[];

  // 加载状态
  isLoading: boolean;

  // 错误处理
  error: string | null;

  // Agent 阶段扩展（预留）
  currentTool: string | null; // 当前执行的工具
  toolStatus: ToolStatus | null; // 工具执行状态

  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}
```

### Store 文件结构

```
store/
├── chat-store.ts       # 聊天状态 Store
├── index.ts            # 统一导出
└── types.ts            # Store 相关类型（可选）
```

### 使用方式

```typescript
// 组件中使用
import { useChatStore } from '@/store/chat-store';

function ChatInterface() {
  const { messages, isLoading, addMessage } = useChatStore();
  // ...
}
```

### 状态说明

| 状态          | 类型                 | 用途                 | 阶段 |
| ------------- | -------------------- | -------------------- | ---- |
| `messages`    | `Message[]`          | 完整对话历史         | 1    |
| `isLoading`   | `boolean`            | 是否正在等待 AI 回复 | 1    |
| `error`       | `string \| null`     | 错误信息             | 1    |
| `currentTool` | `string \| null`     | 当前执行的工具名     | 3    |
| `toolStatus`  | `ToolStatus \| null` | 工具执行状态         | 3    |

### 为什么选择 Zustand

| 特点       | 说明                    |
| ---------- | ----------------------- |
| 轻量       | 仅 ~1KB，无 boilerplate |
| 简单       | 不需要 Provider 包裹    |
| TypeScript | 原生支持，类型推断好    |
| 调试       | 支持 Redux DevTools     |
| 扩展性     | 适合从简单到复杂的演进  |

---

## 数据库架构（阶段 4）

使用 **Supabase PostgreSQL** 存储用户会话和消息。

### 数据表

```sql
-- 会话表
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- 消息表
messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  tool_calls JSONB,  -- 工具调用记录
  created_at TIMESTAMPTZ
)
```

### Row Level Security

```sql
-- 用户只能访问自己的会话和消息
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own sessions" ON messages
  FOR ALL USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
```

### 数据流

```
登录用户发送消息
    │
    ├─► 创建/获取 session
    │
    ├─► 保存用户消息到 messages 表
    │
    ├─► 调用 AI 获取回复
    │
    └─► 保存助手消息到 messages 表
```

---

## 环境变量

```bash
# .env.local

# LLM 配置（阿里云灵积/通义千问）
DASHSCOPE_API_KEY=your_dashscope_api_key
LLM_MODEL=qwen-plus
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# MCP 工具 API Key（阶段 3）
AMAP_API_KEY=your_amap_api_key
VARIFLIGHT_API_KEY=your_variflight_api_key

# Supabase 配置（阶段 4）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**变量说明：**

| 变量                            | 必需   | 说明                     |
| ------------------------------- | ------ | ------------------------ |
| `DASHSCOPE_API_KEY`             | 是     | 阿里云灵积 API 密钥      |
| `LLM_MODEL`                     | 否     | 模型名称，默认 qwen-plus |
| `LLM_BASE_URL`                  | 否     | 模型 API 地址            |
| `AMAP_API_KEY`                  | 是\*   | 高德地图 API Key         |
| `VARIFLIGHT_API_KEY`            | 否     | 飞常准 API Key           |
| `NEXT_PUBLIC_SUPABASE_URL`      | 是\*\* | Supabase 项目 URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是\*\* | Supabase 匿名 Key        |

\*工具调用功能需要 \*\*持久化功能需要

---

## 依赖清单

### 核心依赖

| 包名                   | 用途               |
| ---------------------- | ------------------ |
| `next`                 | React 全栈框架     |
| `react`                | UI 库              |
| `zustand`              | 状态管理           |
| `langchain`            | LLM 应用框架       |
| `@langchain/community` | 社区集成（含智谱） |

### 开发依赖

| 包名                     | 用途                   |
| ------------------------ | ---------------------- |
| `typescript`             | 类型支持               |
| `tailwindcss`            | 样式                   |
| `@types/react`           | React 类型             |
| `eslint`                 | 代码检查               |
| `prettier`               | 代码格式化             |
| `eslint-config-prettier` | ESLint + Prettier 兼容 |
| `husky`                  | Git 钩子               |
| `lint-staged`            | 暂存文件检查           |

### UI 组件（shadcn/ui）

按需添加，初始建议：

- `button`
- `input`
- `card`
- `scroll-area`

---

## 错误处理策略

| 错误类型     | 处理方式                      |
| ------------ | ----------------------------- |
| API Key 无效 | 返回 401，前端显示配置提示    |
| 网络超时     | 返回 504，前端提示重试        |
| 模型限流     | 返回 429，前端显示稍后再试    |
| 输入过长     | 前端校验 + API 校验，提示缩短 |

---

## 安全考虑

1. **API Key 保护**
   - 只存在服务端（`.env.local`）
   - 不暴露给前端
   - 不提交到 Git（加入 `.gitignore`）

2. **输入校验**
   - 限制消息长度
   - 过滤敏感内容（可选）

3. **速率限制**（后续）
   - 每用户请求频率限制
   - 防止滥用

---

## RAG 知识增强模块（阶段 5）

### 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        知识导入流程                                  │
│  ┌───────────────┐    ┌───────────┐    ┌───────────┐    ┌────────┐ │
│  │ knowledge.jsonl│ → │ Loader    │ → │ Splitter  │ → │Embedding│ │
│  │ (701 条景点)  │    │ (解析)    │    │ (切分)    │    │ (向量) │ │
│  └───────────────┘    └───────────┘    └───────────┘    └────────┘ │
│                                                              │      │
│                                                              ▼      │
│                                              ┌─────────────────────┐│
│                                              │  Supabase pgvector  ││
│                                              │  knowledge_documents││
│                                              └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        查询检索流程                                  │
│  ┌───────────┐    ┌───────────┐    ┌────────────────┐              │
│  │ 用户问题   │ → │ Embedding │ → │ 相似度搜索      │              │
│  │ "三亚玩什么"│    │ (向量化)  │    │ (Top-K + 阈值) │              │
│  └───────────┘    └───────────┘    └────────────────┘              │
│                                              │                      │
│                                              ▼                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                   RAG 增强 Agent                               ││
│  │  System Prompt + 检索知识上下文 + 用户问题 → LLM → 回答        ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 模块结构

```
src/lib/langchain/rag/
├── index.ts           # 统一导出
├── embeddings.ts      # Embedding 模型配置（text-embedding-v3, 1024维）
├── loader.ts          # JSONL 文档加载器
├── splitter.ts        # 文档切分器（chunkSize: 1000）
├── store.ts           # 向量存储（Supabase pgvector）
└── retriever.ts       # 知识检索器（top-k=3, 阈值=0.65）

src/data/knowledge/
└── knowledge.jsonl    # 701 条景点知识数据

scripts/
└── ingest-knowledge.ts  # 知识导入脚本
```

### 数据库表

```sql
-- knowledge_documents 表
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,           -- 文档内容
  metadata JSONB DEFAULT '{}',     -- 元数据（name, city, tags, rating）
  embedding VECTOR(1024),          -- 1024维向量
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- HNSW 索引（高效向量搜索）
CREATE INDEX ON knowledge_documents
USING hnsw (embedding vector_cosine_ops);
```

### 检索策略

| 参数   | 值   | 说明                   |
| ------ | ---- | ---------------------- |
| Top-K  | 3    | 返回最相关的 3 条结果  |
| 阈值   | 0.65 | 相似度低于此值的过滤掉 |
| 按城市 | 可选 | 自动从问题提取城市筛选 |

### 环境变量

```bash
# RAG 相关（在 .env.local 中配置）
DASHSCOPE_API_KEY=xxx           # Embedding 模型 API Key（与 LLM 共用）
SUPABASE_SERVICE_ROLE_KEY=xxx   # 知识导入脚本需要
```

### 使用命令

```bash
# 模拟导入（不写入数据库）
npm run ingest:dry-run

# 正式导入
npm run ingest

# 清空后重新导入
npm run ingest:clear
```

---

## 扩展点预留

为后续阶段预留的扩展：

| 阶段   | 扩展点   | 位置                   | 状态      |
| ------ | -------- | ---------------------- | --------- |
| 阶段 2 | 流式响应 | `/api/chat/route.ts`   | ✅ 已完成 |
| 阶段 3 | 工具调用 | `lib/langchain/tools/` | ✅ 已完成 |
| 阶段 4 | 数据库   | `lib/supabase/`        | ✅ 已完成 |
| 阶段 5 | RAG      | `lib/langchain/rag/`   | ✅ 已完成 |

---

## 测试策略

### 测试框架

| 工具                  | 用途           |
| --------------------- | -------------- |
| Vitest                | 单元测试运行器 |
| React Testing Library | 组件测试       |
| MSW                   | API Mock       |

### 测试文件结构

```
__tests__/
├── lib/
│   └── utils.test.ts       # 工具函数测试
├── components/
│   └── ChatInput.test.tsx  # 组件测试
└── setup.ts                # 测试配置
```

### 测试命令

```bash
npm run test          # 运行所有测试
npm run test:watch    # 监视模式
npm run test:coverage # 覆盖率报告
```

---

## CI/CD 流程

### GitHub Actions

```yaml
# .github/workflows/ci.yml
触发条件: PR 到 main 分支
步骤: 1. 安装依赖
  2. ESLint 检查
  3. TypeScript 类型检查
  4. 运行测试
```

### Vercel 部署

- 自动部署 main 分支
- PR 预览部署
- 环境变量通过 Vercel Dashboard 配置

---

## 工具安装指南

### UI UX Pro Max Skill

通过官方 CLI 安装 UI/UX 设计智能：

```bash
# 全局安装 CLI
npm install -g uipro-cli

# 进入项目目录后安装
uipro init --ai cursor
```

详见：[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

### OpenSpec

OpenSpec 目录结构已预置：

```
openspec/
├── project.md      # 项目上下文（给 AI）
├── specs/          # 当前规范
└── changes/        # 变更提案
```

详见：[OpenSpec](https://github.com/Fission-AI/OpenSpec)

---

_最后更新：2026-01-27（阶段 5 RAG 知识增强完成）_
