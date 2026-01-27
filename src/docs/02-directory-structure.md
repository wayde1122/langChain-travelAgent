# 项目目录结构规划

> 本文档定义了旅行助手项目的前端和后端目录结构，符合 Next.js App Router 规范。

---

## 目录总览

```
src/
├── app/                          # Next.js App Router（页面 + API）
│   ├── (routes)/                 # 路由分组（前端页面）
│   │   ├── layout.tsx            # 应用布局
│   │   ├── page.tsx              # 首页（聊天界面）
│   │   ├── loading.tsx           # 加载状态
│   │   └── error.tsx             # 错误边界
│   │
│   ├── api/                      # API 路由（后端）
│   │   └── chat/
│   │       └── route.ts          # POST /api/chat
│   │
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── favicon.ico
│
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── scroll-area.tsx
│   │   └── ...
│   │
│   ├── chat/                     # 聊天相关组件
│   │   ├── ChatInterface.tsx     # 聊天界面容器
│   │   ├── MessageList.tsx       # 消息列表
│   │   ├── MessageItem.tsx       # 单条消息
│   │   ├── ChatInput.tsx         # 输入框
│   │   └── index.ts              # 统一导出
│   │
│   ├── layout/                   # 布局组件
│   │   ├── Header.tsx            # 顶部导航
│   │   ├── Sidebar.tsx           # 侧边栏（后续）
│   │   └── index.ts
│   │
│   └── shared/                   # 共享组件
│       ├── LoadingSpinner.tsx    # 加载指示器
│       ├── ErrorMessage.tsx      # 错误提示
│       └── index.ts
│
├── lib/                          # 核心业务逻辑
│   ├── langchain/                # LangChain 相关（后端）
│   │   ├── model.ts              # 模型配置
│   │   ├── prompts.ts            # 提示词模板
│   │   ├── chain.ts              # 链式调用
│   │   └── index.ts
│   │
├── services/                     # 前端服务层（API 调用封装）
│   ├── chat.ts                   # 聊天服务
│   └── index.ts
│   │
│   ├── utils/                    # 工具函数
│   │   ├── cn.ts                 # className 合并（shadcn）
│   │   ├── format.ts             # 格式化函数
│   │   └── index.ts
│   │
│   └── constants/                # 常量定义
│       ├── prompts.ts            # Prompt 常量
│       ├── config.ts             # 应用配置
│       └── index.ts
│
├── hooks/                        # 自定义 Hooks
│   ├── useChat.ts                # 聊天逻辑 Hook
│   ├── useScrollToBottom.ts      # 自动滚动 Hook
│   └── index.ts
│
├── services/                     # 前端服务层（API 调用封装）
│   ├── chat.ts                   # 聊天服务
│   └── index.ts
│
├── store/                        # Zustand 状态管理
│   ├── chat-store.ts             # 聊天状态
│   ├── ui-store.ts               # UI 状态（后续）
│   └── index.ts
│
├── types/                        # TypeScript 类型
│   ├── chat.ts                   # 聊天相关类型
│   ├── api.ts                    # API 请求/响应类型
│   └── index.ts
│
├── styles/                       # 样式文件（可选）
│   └── components.css            # 组件特定样式
│
├── __tests__/                    # 测试文件
│   ├── components/               # 组件测试
│   │   └── ChatInput.test.tsx
│   ├── lib/                      # 工具函数测试
│   │   └── utils.test.ts
│   ├── hooks/                    # Hook 测试
│   └── setup.ts                  # 测试配置
│
└── docs/                         # 项目文档
    ├── 01-environment-setup.md
    └── 02-directory-structure.md
```

---

## 前端目录详解

### app/ - Next.js App Router

Next.js 16 使用 App Router，所有路由文件放在 `app/` 目录下。

```
app/
├── layout.tsx          # 根布局（必需）
├── page.tsx            # 首页 → /
├── globals.css         # 全局样式
├── loading.tsx         # 全局加载状态
├── error.tsx           # 全局错误边界
├── not-found.tsx       # 404 页面
│
└── api/                # API 路由
    └── chat/
        └── route.ts    # POST /api/chat
```

**文件约定：**

| 文件          | 用途                 |
| ------------- | -------------------- |
| `layout.tsx`  | 共享布局，包裹子页面 |
| `page.tsx`    | 页面组件，定义路由   |
| `loading.tsx` | 加载状态（Suspense） |
| `error.tsx`   | 错误边界             |
| `route.ts`    | API 路由处理器       |

### components/ - React 组件

按功能模块组织组件：

```
components/
├── ui/           # 基础 UI 组件（shadcn/ui）
├── chat/         # 聊天功能组件
├── layout/       # 布局组件
└── shared/       # 共享/通用组件
```

**组件命名规范：**

- 文件名：`PascalCase.tsx`（如 `ChatInput.tsx`）
- 每个目录包含 `index.ts` 统一导出
- Server Component 为默认，Client Component 需添加 `"use client"`

### hooks/ - 自定义 Hooks

```
hooks/
├── useChat.ts              # 封装聊天逻辑
├── useScrollToBottom.ts    # 消息列表自动滚动
├── useLocalStorage.ts      # 本地存储（后续）
└── index.ts
```

### lib/ - 核心逻辑

存放后端业务逻辑和工具函数：

```
lib/
├── langchain/     # 后端：LangChain 配置（仅服务端使用）
├── utils/         # 通用：工具函数
└── constants/     # 通用：常量定义
```

### services/ - 前端服务层

封装前端调用后端 API 的逻辑：

```
services/
├── chat.ts        # 聊天服务（调用 /api/chat）
└── index.ts
```

---

## 后端目录详解

### API 路由结构

```
app/api/
├── chat/
│   └── route.ts           # POST /api/chat - 基础聊天
│
├── chat/
│   └── stream/
│       └── route.ts       # POST /api/chat/stream - 流式聊天（阶段 2）
│
└── tools/                  # 工具调用（阶段 3）
    ├── weather/
    │   └── route.ts       # GET /api/tools/weather
    └── exchange/
        └── route.ts       # GET /api/tools/exchange
```

### LangChain 模块

```
lib/langchain/
├── model.ts       # 模型初始化
├── prompts.ts     # Prompt 模板
├── chain.ts       # Chain 配置
├── tools/         # 工具定义（阶段 3）
│   ├── weather.ts
│   ├── exchange.ts
│   └── index.ts
└── index.ts
```

---

## 文件职责说明

### 前端关键文件

| 文件                                | 职责                     |
| ----------------------------------- | ------------------------ |
| `app/page.tsx`                      | 首页，渲染 ChatInterface |
| `components/chat/ChatInterface.tsx` | 聊天容器，组合子组件     |
| `components/chat/MessageList.tsx`   | 消息列表渲染             |
| `components/chat/ChatInput.tsx`     | 输入框和发送按钮         |
| `hooks/useChat.ts`                  | 聊天逻辑封装             |
| `store/chat-store.ts`               | 消息状态管理             |
| `services/chat.ts`                  | 调用后端 API             |

### 后端关键文件

| 文件                       | 职责                |
| -------------------------- | ------------------- |
| `app/api/chat/route.ts`    | 处理聊天请求        |
| `lib/langchain/model.ts`   | 初始化 GLM 模型     |
| `lib/langchain/prompts.ts` | 定义 System Prompt  |
| `lib/langchain/chain.ts`   | 组合 Prompt + Model |

---

## 导入路径别名

使用 `@/` 作为 `src/` 的别名，简化导入：

```typescript
// 推荐
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store';
import { ChatRequest } from '@/types';

// 避免
import { Button } from '../../../components/ui/button';
```

**tsconfig.json 配置：**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 组件导入规范

每个模块目录包含 `index.ts` 统一导出：

```typescript
// components/chat/index.ts
export { ChatInterface } from './ChatInterface';
export { MessageList } from './MessageList';
export { MessageItem } from './MessageItem';
export { ChatInput } from './ChatInput';

// 使用时
import { ChatInterface, ChatInput } from '@/components/chat';
```

---

## Server vs Client Components

### Server Components（默认）

适用于：

- 数据获取
- 访问后端资源
- 不需要交互的 UI

```tsx
// app/page.tsx（Server Component）
export default function HomePage() {
  return <ChatInterface />;
}
```

### Client Components

适用于：

- 使用 useState、useEffect
- 事件处理（onClick 等）
- 浏览器 API

```tsx
// components/chat/ChatInput.tsx
'use client';

import { useState } from 'react';

export function ChatInput() {
  const [input, setInput] = useState('');
  // ...
}
```

---

## 阶段演进

### 阶段 1 - 基础对话 ✅

```
src/
├── app/
│   ├── api/chat/route.ts      ✅
│   └── page.tsx               ✅
├── components/chat/           ✅
├── lib/langchain/             ✅
├── store/chat-store.ts        ✅
└── types/chat.ts              ✅
```

### 阶段 2 - 流式输出 ✅

```
src/
├── app/api/chat/route.ts      ✅ 支持 SSE 流式响应
├── services/chat.ts           ✅ 流式消息处理
└── components/chat/
    └── LoadingIndicator.tsx   ✅ 加载状态 + 停止按钮
```

### 阶段 3 - 工具调用 ✅

```
src/
├── lib/langchain/
│   ├── agent.ts               ✅ ReAct Agent
│   ├── mcp-client.ts          ✅ MCP 客户端
│   └── tools/
│       ├── current-date.ts    ✅ 日期工具
│       └── index.ts           ✅ 工具导出 + 显示名称
└── components/chat/
    └── ToolCallSteps.tsx      ✅ 工具调用展示
```

### 阶段 4 - 持久化 ✅

```
src/
├── app/auth/                  ✅ 认证页面
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/auth/           ✅ 认证组件
│   ├── AuthProvider.tsx
│   └── UserMenu.tsx
├── components/chat/
│   ├── ChatLayout.tsx         ✅ 布局（含侧边栏）
│   └── Sidebar.tsx            ✅ 会话列表
├── lib/supabase/              ✅ Supabase 客户端
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── services/session.ts        ✅ 会话 CRUD
├── store/session-store.ts     ✅ 会话状态
├── types/database.ts          ✅ 数据库类型
├── middleware.ts              ✅ Auth 中间件
└── supabase/migrations/       ✅ 数据库迁移
    └── 001_create_tables.sql
```

---

_文档更新时间：2026-01-27_
