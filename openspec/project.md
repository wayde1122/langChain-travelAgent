# OpenSpec - 项目上下文

> 此文件为 AI 编码助手提供项目级别的上下文信息，确保一致性和对齐。

---

## 项目信息

**项目名称**: 旅行助手 (Travel Assistant)  
**项目类型**: AI 聊天应用  
**目标用户**: 需要旅行建议和规划的用户  
**当前阶段**: 阶段 1 - 基础对话（环境搭建完成，待实现核心功能）

---

## 技术栈

| 层级     | 技术                           | 版本             |
| -------- | ------------------------------ | ---------------- |
| 框架     | Next.js (App Router)           | 16.1.4           |
| 语言     | TypeScript (strict mode)       | ^5               |
| 运行时   | React                          | 19.2.3           |
| 样式     | Tailwind CSS                   | ^4               |
| UI 组件  | shadcn/ui + Lucide Icons       | -                |
| 状态管理 | Zustand                        | ^5.0.10          |
| AI 框架  | LangChain.js                   | ^1.2.12          |
| AI 核心  | @langchain/core                | ^1.1.16          |
| LLM      | 智谱 AI (GLM-4-Flash)          | -                |
| 测试     | Vitest + React Testing Library | ^4.0.18          |
| 代码规范 | ESLint + Prettier              | ^9 / ^3.8.1      |
| Git 钩子 | Husky + lint-staged            | ^9.1.7 / ^16.2.7 |
| CI       | GitHub Actions                 | -                |
| 部署     | Vercel                         | -                |

---

## 核心类型

### 消息角色

```typescript
type MessageRole = 'user' | 'assistant' | 'system';
```

### 消息接口

```typescript
interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}
```

### 聊天状态

```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

type ChatStore = ChatState & ChatActions;
```

### 对话流程

```
用户输入 → ChatInput 触发 → addMessage() → API 调用 → LLM 处理 → 响应返回 → UI 更新
```

---

## 目录结构

所有源代码位于 `src/` 目录下：

| 路径                 | 用途                    | 状态      |
| -------------------- | ----------------------- | --------- |
| `src/app/`           | Next.js 页面和 API 路由 | ✅ 已创建 |
| `src/app/api/chat/`  | 聊天 API 端点           | 📅 待实现 |
| `src/components/`    | React 组件              | 📅 待创建 |
| `src/components/ui/` | shadcn/ui 基础组件      | 📅 待添加 |
| `src/lib/`           | 工具函数和核心逻辑      | ✅ 已创建 |
| `src/lib/langchain/` | LangChain 配置          | 📅 待创建 |
| `src/store/`         | Zustand Store           | ✅ 已实现 |
| `src/types/`         | TypeScript 类型定义     | ✅ 已定义 |
| `src/__tests__/`     | 测试文件                | ✅ 已配置 |
| `src/docs/`          | 内部文档                | ✅ 已创建 |

---

## 关键文件

### 已实现

| 文件                      | 用途                       |
| ------------------------- | -------------------------- |
| `src/app/page.tsx`        | 主页面（待实现聊天界面）   |
| `src/app/layout.tsx`      | 根布局                     |
| `src/store/chat-store.ts` | 聊天状态管理 Store         |
| `src/types/chat.ts`       | 消息和状态类型定义         |
| `src/lib/utils.ts`        | 工具函数（含 cn 类名合并） |

### 待实现

| 文件                               | 用途          |
| ---------------------------------- | ------------- |
| `src/app/api/chat/route.ts`        | 聊天 API 端点 |
| `src/lib/langchain/model.ts`       | LLM 配置      |
| `src/lib/langchain/prompts.ts`     | 提示词模板    |
| `src/components/ChatInterface.tsx` | 聊天界面容器  |
| `src/components/MessageList.tsx`   | 消息列表组件  |
| `src/components/MessageItem.tsx`   | 单条消息组件  |
| `src/components/ChatInput.tsx`     | 输入框组件    |

---

## 环境变量

| 变量            | 用途             | 必需 | 默认值        |
| --------------- | ---------------- | ---- | ------------- |
| `ZHIPU_API_KEY` | 智谱 AI API 密钥 | 是   | -             |
| `ZHIPU_MODEL`   | 模型名称         | 否   | `glm-4-flash` |

---

## 编码约定

### 路径别名

- `@/*` → `./src/*`（在 tsconfig.json 中配置）

### 导入顺序

```typescript
// 1. React/Next
import { useState } from 'react';

// 2. 第三方库
import { create } from 'zustand';

// 3. 内部模块 (@/)
import { useChatStore } from '@/store';

// 4. 相对路径
import { Button } from './Button';

// 5. 类型
import type { Message } from '@/types';
```

### 命名规范

| 类型      | 格式               | 示例                |
| --------- | ------------------ | ------------------- |
| 组件文件  | PascalCase         | `ChatInput.tsx`     |
| 工具函数  | camelCase          | `generateId()`      |
| 常量      | UPPER_SNAKE        | `MAX_LENGTH`        |
| 类型/接口 | PascalCase         | `interface Message` |
| Store     | use + Name + Store | `useChatStore`      |

---

## 设计决策

### 为什么选择 Zustand？

- 轻量级（~1KB），无 boilerplate
- 原生 TypeScript 支持，类型推断好
- 不需要 Provider 包裹
- 为 Agent 阶段的复杂状态做准备

### 为什么选择智谱 AI？

- 国内访问稳定
- GLM-4 系列能力强
- 支持 Function Calling
- API 兼容 OpenAI 格式

### 为什么使用 OpenSpec？

- 规范驱动开发
- AI 协作一致性
- 变更可追溯

### 为什么源码放在 src/ 下？

- Next.js 推荐的项目组织方式
- 清晰区分源代码和配置文件
- 便于 TypeScript 路径别名配置

---

## 迭代阶段

| 阶段 | 名称     | 目标         | 状态      |
| ---- | -------- | ------------ | --------- |
| 1    | 基础对话 | 跑通最小闭环 | 🚧 进行中 |
| 2    | 流式体验 | 打字机效果   | 📅 待开始 |
| 3    | 工具调用 | Agent 能力   | 📅 待开始 |
| 4+   | 后续扩展 | 持久化、RAG  | 📅 规划中 |

---

## NPM 脚本

| 命令                 | 用途                   |
| -------------------- | ---------------------- |
| `npm run dev`        | 启动开发服务器         |
| `npm run build`      | 生产构建               |
| `npm run lint`       | ESLint 检查            |
| `npm run lint:fix`   | ESLint 自动修复        |
| `npm run format`     | Prettier 格式化        |
| `npm run type-check` | TypeScript 类型检查    |
| `npm run test`       | 运行测试（watch 模式） |
| `npm run test:run`   | 运行测试（单次）       |

---

## 相关文档

| 文件                         | 用途               |
| ---------------------------- | ------------------ |
| `ROADMAP.md`                 | 迭代规划和任务清单 |
| `ARCHITECTURE.md`            | 技术架构和设计文档 |
| `CLAUDE.md`                  | AI 协作指南        |
| `openspec/specs/chat-api.md` | 聊天 API 规范      |

---

## 规范链接

- [聊天 API 规范](./specs/chat-api.md) - 定义 `/api/chat` 端点

---

_最后更新：2026-01-23_
