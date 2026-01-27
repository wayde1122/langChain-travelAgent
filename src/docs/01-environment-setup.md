# 环境搭建指南

> 本文档记录了旅行助手项目的环境搭建步骤。

---

## 概述

本项目基于以下技术栈：

| 技术         | 版本   | 用途       |
| ------------ | ------ | ---------- |
| Next.js      | 16.x   | React 框架 |
| TypeScript   | 5.x    | 类型安全   |
| Tailwind CSS | 4.x    | 样式框架   |
| shadcn/ui    | latest | UI 组件库  |
| Zustand      | 5.x    | 状态管理   |
| LangChain    | 1.x    | AI 框架    |
| Vitest       | 4.x    | 测试框架   |

---

## 步骤 1：创建 Next.js 项目

### 执行命令

```bash
npx create-next-app@latest travel-assistant --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

### 选项说明

- `--typescript`: 启用 TypeScript
- `--tailwind`: 集成 Tailwind CSS
- `--eslint`: 集成 ESLint
- `--app`: 使用 App Router
- `--src-dir`: 使用 src 目录结构
- `--import-alias "@/*"`: 设置路径别名

### 生成的目录结构

```
travel-assistant/
├── src/
│   └── app/
│       ├── favicon.ico
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 步骤 2：初始化 shadcn/ui

### 执行命令

```bash
npx shadcn@latest init -d
```

### 生成的文件

- `components.json` - shadcn/ui 配置
- `src/lib/utils.ts` - 工具函数（cn 函数）
- 更新 `src/app/globals.css` - CSS 变量

### 使用方法

添加组件：

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

---

## 步骤 3：配置 ESLint + Prettier

### 安装依赖

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 创建配置文件

**`.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**`.prettierignore`**

```
node_modules
.next
dist
build
coverage
*.min.js
pnpm-lock.yaml
package-lock.json
```

### 更新 eslint.config.mjs

```javascript
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'prettier/prettier': 'warn',
    },
  },
]);
```

### 添加脚本

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 步骤 4：配置 Husky + lint-staged

### 安装依赖

```bash
npm install -D husky lint-staged
```

### 初始化 Husky

```bash
npx husky init
```

### 配置 pre-commit 钩子

**`.husky/pre-commit`**

```bash
npx lint-staged
```

### 配置 lint-staged

在 `package.json` 中添加：

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,json,css,md}": ["prettier --write"]
  }
}
```

---

## 步骤 5：配置 Vitest 测试框架

### 安装依赖

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom jsdom
```

### 创建配置文件

**`vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 创建测试设置文件

**`src/__tests__/setup.ts`**

```typescript
import '@testing-library/dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### 添加脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 步骤 6：安装 Zustand 状态管理

### 安装依赖

```bash
npm install zustand
```

### 创建目录结构

```
src/
├── store/
│   ├── chat-store.ts
│   └── index.ts
└── types/
    ├── chat.ts
    └── index.ts
```

### 示例 Store

**`src/store/chat-store.ts`**

```typescript
import { create } from 'zustand';
import type { ChatStore } from '@/types';

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: generateId(), createdAt: new Date() },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], error: null }),
}));
```

---

## 步骤 7：安装 LangChain 相关依赖

### 安装依赖

```bash
npm install langchain @langchain/core --legacy-peer-deps
```

### 依赖说明

| 包名              | 用途               |
| ----------------- | ------------------ |
| `langchain`       | LangChain 核心框架 |
| `@langchain/core` | 核心抽象和接口     |

### 后续扩展

根据需要安装额外的 LangChain 集成包：

```bash
# 智谱 AI 集成（如需要）
npm install @langchain/community --legacy-peer-deps
```

---

## 步骤 8：配置环境变量

### 创建环境变量文件

**`.env.example`**（提交到 Git）

```env
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

**`.env.local`**（不提交到 Git）

```env
# LLM 配置
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
LLM_MODEL=qwen-plus
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# MCP 工具 API Key
AMAP_API_KEY=xxxxxxxxxxxxxxxx
VARIFLIGHT_API_KEY=xxxxxxxxxxxxxxxx

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx
```

### 获取 API Key

**1. 阿里云灵积（LLM）**

1. 访问 [阿里云灵积平台](https://dashscope.console.aliyun.com/)
2. 注册并登录账号
3. 在控制台创建 API Key
4. 复制 API Key 到 `DASHSCOPE_API_KEY`

**2. 高德地图（天气/POI）**

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 创建应用，选择"Web服务"
3. 复制 Key 到 `AMAP_API_KEY`

**3. 飞常准（航班查询）**

1. 访问 [飞常准开放平台](https://open.variflight.com/)
2. 注册并创建应用
3. 复制 API Key 到 `VARIFLIGHT_API_KEY`

---

## 验证安装

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 确认项目正常运行。

### 运行测试

```bash
npm run test:run
```

### 检查代码规范

```bash
npm run lint
npm run type-check
```

---

## 最终目录结构

```
travel-assistant/
├── .husky/
│   └── pre-commit
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── store/
│   │   ├── chat-store.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── chat.ts
│   │   └── index.ts
│   ├── docs/
│   │   └── 01-environment-setup.md
│   └── __tests__/
│       ├── setup.ts
│       └── example.test.ts
├── .env.example
├── .env.local
├── .gitignore
├── .prettierrc
├── .prettierignore
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

---

## 常用命令

| 命令                    | 说明                     |
| ----------------------- | ------------------------ |
| `npm run dev`           | 启动开发服务器           |
| `npm run build`         | 构建生产版本             |
| `npm run start`         | 启动生产服务器           |
| `npm run lint`          | 运行 ESLint 检查         |
| `npm run lint:fix`      | 自动修复 ESLint 问题     |
| `npm run format`        | 格式化代码               |
| `npm run type-check`    | TypeScript 类型检查      |
| `npm run test`          | 运行测试（watch 模式）   |
| `npm run test:run`      | 运行测试（单次）         |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

---

_文档更新时间：2026-01-27_
