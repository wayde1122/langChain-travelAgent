# OpenSpec - 项目上下文

> 此文件为 AI 编码助手提供项目级别的上下文信息，确保一致性和对齐。

---

## 项目信息

**项目名称**: 旅行助手 (Travel Assistant)
**项目类型**: AI 聊天应用
**目标用户**: 需要旅行建议和规划的用户

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14+ (App Router) |
| 语言 | TypeScript (strict mode) |
| 样式 | Tailwind CSS + shadcn/ui |
| 状态 | Zustand |
| AI | LangChain.js + 智谱 AI (GLM) |
| 测试 | Vitest + React Testing Library |
| CI | GitHub Actions |
| 部署 | Vercel |

---

## 核心概念

### 消息 (Message)
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

### 对话流程
```
用户输入 → 前端状态更新 → API 调用 → LLM 处理 → 响应返回 → UI 更新
```

---

## 目录约定

| 路径 | 用途 |
|------|------|
| `app/` | Next.js 页面和 API 路由 |
| `components/` | React 组件 |
| `components/ui/` | shadcn/ui 基础组件 |
| `lib/` | 工具函数和核心逻辑 |
| `lib/langchain/` | LangChain 配置 |
| `store/` | Zustand Store |
| `types/` | TypeScript 类型定义 |
| `__tests__/` | 测试文件 |

---

## 关键文件

| 文件 | 用途 |
|------|------|
| `app/page.tsx` | 主聊天界面 |
| `app/api/chat/route.ts` | 聊天 API |
| `lib/langchain/model.ts` | LLM 配置 |
| `lib/langchain/prompts.ts` | 提示词模板 |
| `store/chat-store.ts` | 聊天状态 |
| `components/ChatInterface.tsx` | 聊天界面容器 |

---

## 环境变量

| 变量 | 用途 | 必需 |
|------|------|------|
| `ZHIPU_API_KEY` | 智谱 AI API 密钥 | 是 |
| `ZHIPU_MODEL` | 模型名称 | 否 |

---

## 设计决策

### 为什么选择 Zustand？
- 轻量级，无 boilerplate
- 原生 TypeScript 支持
- 为 Agent 阶段的复杂状态做准备

### 为什么选择智谱 AI？
- 国内访问稳定
- GLM-4 系列能力强
- 支持 Function Calling

### 为什么使用 OpenSpec？
- 规范驱动开发
- AI 协作一致性
- 变更可追溯

---

## 迭代阶段

1. **阶段 1**: 基础对话（当前）
2. **阶段 2**: 流式体验
3. **阶段 3**: 工具调用 (Agent)
4. **后续**: 持久化、RAG

---

## 相关文档

- `ROADMAP.md` - 迭代规划
- `ARCHITECTURE.md` - 技术架构
- `SPEC.md` - 编码规范
- `CLAUDE.md` - AI 协作指南

---

*最后更新：2026-01-22*
