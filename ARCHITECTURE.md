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
                              │
                              │ HTTP POST /api/chat
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js API Routes                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   /api/chat/route.ts                     │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │   │
│  │  │ 请求验证   │→ │ Prompt    │→ │ LangChain 调用    │   │   │
│  │  │           │  │ 构造      │  │                   │   │   │
│  │  └───────────┘  └───────────┘  └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ LangChain.js
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        智谱 AI API                               │
│                     (GLM-4 / GLM-4-Flash)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
travel-assistant/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页（聊天主界面）
│   ├── globals.css             # 全局样式
│   └── api/                    # API 路由
│       └── chat/
│           └── route.ts        # 聊天 API 端点
│
├── components/                 # React 组件
│   ├── ui/                     # shadcn/ui 组件（自动生成）
│   ├── ChatInterface.tsx       # 聊天界面容器
│   ├── MessageList.tsx         # 消息列表
│   ├── MessageItem.tsx         # 单条消息
│   └── ChatInput.tsx           # 输入框组件
│
├── lib/                        # 核心逻辑
│   ├── langchain/              # LangChain 相关
│   │   ├── model.ts            # 模型配置
│   │   ├── prompts.ts          # 提示词模板
│   │   └── chain.ts            # 链式调用（阶段 2+）
│   └── utils.ts                # 工具函数
│
├── store/                      # Zustand 状态管理
│   ├── chat-store.ts           # 聊天状态 Store
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

| 组件 | 职责 | 状态管理 |
|------|------|----------|
| `ChatInterface` | 聊天界面容器，管理消息状态 | messages, isLoading |
| `MessageList` | 展示消息列表，自动滚动 | 无（接收 props） |
| `MessageItem` | 单条消息渲染 | 无（纯展示） |
| `ChatInput` | 用户输入，发送消息 | input value |

### 2. API 层设计

**端点：** `POST /api/chat`

**请求体：**
```typescript
interface ChatRequest {
  messages: Message[];  // 对话历史
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}
```

**响应体（阶段 1）：**
```typescript
interface ChatResponse {
  message: {
    role: "assistant";
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
  currentTool: string | null;      // 当前执行的工具
  toolStatus: ToolStatus | null;   // 工具执行状态
  
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

| 状态 | 类型 | 用途 | 阶段 |
|------|------|------|------|
| `messages` | `Message[]` | 完整对话历史 | 1 |
| `isLoading` | `boolean` | 是否正在等待 AI 回复 | 1 |
| `error` | `string \| null` | 错误信息 | 1 |
| `currentTool` | `string \| null` | 当前执行的工具名 | 3 |
| `toolStatus` | `ToolStatus \| null` | 工具执行状态 | 3 |

### 为什么选择 Zustand

| 特点 | 说明 |
|------|------|
| 轻量 | 仅 ~1KB，无 boilerplate |
| 简单 | 不需要 Provider 包裹 |
| TypeScript | 原生支持，类型推断好 |
| 调试 | 支持 Redux DevTools |
| 扩展性 | 适合从简单到复杂的演进 |

---

## 环境变量

```bash
# .env.local

# 智谱 AI API Key
ZHIPU_API_KEY=your_api_key_here

# 可选：指定模型
ZHIPU_MODEL=glm-4-flash
```

**变量说明：**

| 变量 | 必需 | 说明 |
|------|------|------|
| `ZHIPU_API_KEY` | 是 | 智谱开放平台 API 密钥 |
| `ZHIPU_MODEL` | 否 | 模型名称，默认 glm-4-flash |

---

## 依赖清单

### 核心依赖

| 包名 | 用途 |
|------|------|
| `next` | React 全栈框架 |
| `react` | UI 库 |
| `zustand` | 状态管理 |
| `langchain` | LLM 应用框架 |
| `@langchain/community` | 社区集成（含智谱） |

### 开发依赖

| 包名 | 用途 |
|------|------|
| `typescript` | 类型支持 |
| `tailwindcss` | 样式 |
| `@types/react` | React 类型 |
| `eslint` | 代码检查 |
| `prettier` | 代码格式化 |
| `eslint-config-prettier` | ESLint + Prettier 兼容 |
| `husky` | Git 钩子 |
| `lint-staged` | 暂存文件检查 |

### UI 组件（shadcn/ui）

按需添加，初始建议：
- `button`
- `input`
- `card`
- `scroll-area`

---

## 错误处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| API Key 无效 | 返回 401，前端显示配置提示 |
| 网络超时 | 返回 504，前端提示重试 |
| 模型限流 | 返回 429，前端显示稍后再试 |
| 输入过长 | 前端校验 + API 校验，提示缩短 |

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

## 扩展点预留

为后续阶段预留的扩展：

| 阶段 | 扩展点 | 位置 |
|------|--------|------|
| 阶段 2 | 流式响应 | `/api/chat/route.ts` |
| 阶段 3 | 工具调用 | `lib/langchain/tools/` |
| 后续 | 数据库 | `lib/db/` |
| 后续 | RAG | `lib/langchain/retriever.ts` |

---

## 测试策略

### 测试框架

| 工具 | 用途 |
|------|------|
| Vitest | 单元测试运行器 |
| React Testing Library | 组件测试 |
| MSW | API Mock |

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
步骤:
  1. 安装依赖
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

*最后更新：2026-01-22*
