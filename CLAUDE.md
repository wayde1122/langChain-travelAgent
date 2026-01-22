# CLAUDE.md - AI 协作指南

> 本文件为 AI 编码助手（Claude、Cursor、GitHub Copilot 等）提供项目上下文和协作规范。

---

## 项目概述

**旅行助手** - 一个基于 LangChain.js + Next.js 的 AI 旅行助手应用。

### 核心功能
- 旅行问答和建议
- 行程规划
- 实时信息查询（天气、汇率）
- 个性化推荐

### 技术栈
- **框架**: Next.js 14+ (App Router)
- **AI**: LangChain.js + 智谱 AI (GLM)
- **状态**: Zustand
- **样式**: Tailwind CSS + shadcn/ui
- **测试**: Vitest + React Testing Library

---

## 项目结构

```
travel-assistant/
├── app/                    # Next.js 页面和 API
│   ├── api/chat/           # 聊天 API
│   └── page.tsx            # 主页面
├── components/             # React 组件
│   ├── ui/                 # shadcn/ui 组件
│   └── *.tsx               # 业务组件
├── lib/                    # 核心逻辑
│   └── langchain/          # LangChain 配置
├── store/                  # Zustand Store
├── types/                  # TypeScript 类型
├── openspec/               # OpenSpec 规范
│   ├── specs/              # 当前规范
│   └── changes/            # 变更提案
└── __tests__/              # 测试文件
```

---

## 编码规范

### 必须遵守

1. **TypeScript 严格模式** - 不使用 `any`
2. **函数式组件** - 使用 Hooks，不用 Class
3. **Server Components 优先** - 仅必要时添加 `"use client"`
4. **Tailwind 样式** - 不写内联 style
5. **错误处理** - try-catch 包裹异步操作

### 命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| 组件 | PascalCase | `ChatInput.tsx` |
| 函数 | camelCase | `sendMessage()` |
| 常量 | UPPER_SNAKE | `MAX_LENGTH` |
| 类型 | PascalCase | `interface Message` |

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

---

## AI 协作指南

### 代码生成时

1. **先读取相关文件** - 理解现有代码风格
2. **遵循 SPEC.md** - 项目规范文档
3. **遵循 OpenSpec** - 查看 `openspec/specs/` 中的规范
4. **小步迭代** - 每次改动聚焦单一功能
5. **添加注释** - 复杂逻辑需要说明

### 测试要求

- 工具函数：必须有单元测试
- 组件：关键交互需要测试
- API：Mock 外部依赖

### 提交前检查

```bash
npm run lint        # ESLint 检查
npm run type-check  # TypeScript 检查
npm run test        # 运行测试
```

---

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `ROADMAP.md` | 迭代规划和任务清单 |
| `ARCHITECTURE.md` | 技术架构和设计文档 |
| `SPEC.md` | 编码规范和约定 |
| `openspec/project.md` | 项目上下文（给 AI） |

---

## 常见任务

### 添加新组件

1. 在 `components/` 创建文件
2. 使用 shadcn/ui 基础组件
3. 添加 TypeScript 类型
4. 考虑是否需要测试

### 添加新 API

1. 在 `app/api/` 创建路由
2. 实现请求验证
3. 添加错误处理
4. 更新 API 类型定义

### 修改 Store

1. 更新 `store/chat-store.ts`
2. 添加新的 Action
3. 更新相关组件
4. 添加测试

---

## 禁止事项

- ❌ 不要修改 `node_modules`
- ❌ 不要提交 `.env.local`
- ❌ 不要使用 `any` 类型
- ❌ 不要跳过 TypeScript 错误
- ❌ 不要删除测试文件
- ❌ 不要硬编码 API Key

---

## 有问题时

1. 查看 `ARCHITECTURE.md` 了解设计决策
2. 查看 `SPEC.md` 了解编码规范
3. 查看 `openspec/specs/` 了解功能规范
4. 如果不确定，先询问

---

*最后更新：2026-01-22*
