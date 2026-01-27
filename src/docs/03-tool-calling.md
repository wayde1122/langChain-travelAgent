# 工具调用实现指南

> 本文档记录了阶段 3 工具调用（Tool Calling）的实现过程，让助手从"聊天"升级为"Agent"。

---

## 概述

### 目标

让助手能够调用外部 API 获取实时信息：

- 查询当前日期
- 获取天气信息（高德地图 MCP）
- 查询航班信息（飞常准 MCP）

### 技术方案

| 组件       | 方案                         | 说明           |
| ---------- | ---------------------------- | -------------- |
| Agent 框架 | LangGraph `createReactAgent` | ReAct 决策循环 |
| 本地工具   | `@langchain/core/tools`      | 自定义工具     |
| MCP 集成   | `@langchain/mcp-adapters`    | 外部 MCP 服务  |

---

## 环境变量配置

```bash
# .env.local

# 高德地图 API Key（天气/POI 查询）
AMAP_API_KEY=your_amap_api_key

# 飞常准 API Key（航班查询）
VARIFLIGHT_API_KEY=your_variflight_api_key
```

### 获取 API Key

**高德地图：**

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 创建应用 → 选择"Web服务"
3. 复制 Key

**飞常准：**

1. 访问 [飞常准开放平台](https://open.variflight.com/)
2. 注册并创建应用
3. 复制 API Key

---

## 安装依赖

```bash
npm install @langchain/langgraph @langchain/mcp-adapters --legacy-peer-deps
```

---

## 核心实现

### 1. 本地工具定义

**`src/lib/langchain/tools/current-date.ts`**

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const currentDateTool = tool(
  async () => {
    const now = new Date();
    return now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  },
  {
    name: 'get_current_date',
    description:
      '获取当前日期和星期几，用于用户询问今天日期或需要判断时间相关的问题',
    schema: z.object({}),
  }
);
```

### 2. MCP 客户端配置

**`src/lib/langchain/mcp-client.ts`**

```typescript
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

export async function createMCPClient(): Promise<MultiServerMCPClient | null> {
  const mcpServers: Record<string, ServerConfig> = {};

  // 高德地图 MCP
  if (process.env.AMAP_API_KEY) {
    mcpServers['amap-maps'] = {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropics/mcp-server-amap-maps'],
      env: {
        AMAP_MAPS_API_KEY: process.env.AMAP_API_KEY,
      },
    };
  }

  // 飞常准 MCP
  if (process.env.VARIFLIGHT_API_KEY) {
    mcpServers['variflight'] = {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropics/mcp-server-variflight'],
      env: {
        VARIFLIGHT_API_KEY: process.env.VARIFLIGHT_API_KEY,
      },
    };
  }

  if (Object.keys(mcpServers).length === 0) {
    return null;
  }

  const client = new MultiServerMCPClient({ mcpServers });
  await client.initializeConnections();
  return client;
}
```

### 3. ReAct Agent 创建

**`src/lib/langchain/agent.ts`**

```typescript
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { getLLM } from './model';
import { currentDateTool } from './tools/current-date';
import { createMCPClient } from './mcp-client';

export async function createTravelAgent() {
  const llm = getLLM();
  const tools = [currentDateTool];

  // 加载 MCP 工具
  const mcpClient = await createMCPClient();
  if (mcpClient) {
    const mcpTools = await mcpClient.getTools();
    tools.push(...mcpTools);
  }

  return createReactAgent({
    llm,
    tools,
  });
}
```

---

## API 路由实现

**`src/app/api/chat/route.ts`**

```typescript
import { createTravelAgent } from '@/lib/langchain/agent';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const agent = await createTravelAgent();

  // 构建消息历史
  const langchainMessages = messages.map((msg) => {
    switch (msg.role) {
      case 'system':
        return new SystemMessage(msg.content);
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
    }
  });

  // 使用 streamEvents 获取工具调用过程
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const eventStream = agent.streamEvents(
        { messages: langchainMessages },
        { version: 'v2' }
      );

      for await (const event of eventStream) {
        // 处理不同类型的事件
        if (event.event === 'on_chat_model_stream') {
          // 流式文本输出
          const content = event.data.chunk?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        } else if (event.event === 'on_tool_start') {
          // 工具调用开始
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'tool_start',
                name: event.name,
                input: event.data.input,
              })}\n\n`
            )
          );
        } else if (event.event === 'on_tool_end') {
          // 工具调用结束
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'tool_end',
                name: event.name,
                output: event.data.output,
              })}\n\n`
            )
          );
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

## 前端工具调用展示

### 工具调用状态类型

**`src/types/chat.ts`**

```typescript
export interface ToolCall {
  id: string;
  name: string;
  displayName: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

export interface MessageWithTools extends Message {
  toolCalls?: ToolCall[];
}
```

### 工具调用步骤组件

**`src/components/chat/ToolCallSteps.tsx`**

```typescript
'use client';

import { ChevronDown, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { ToolCall } from '@/types';

interface ToolCallStepsProps {
  toolCalls: ToolCall[];
}

export function ToolCallSteps({ toolCalls }: ToolCallStepsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-2 mb-3">
      {toolCalls.map((tool) => (
        <div key={tool.id} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => ({
              ...prev,
              [tool.id]: !prev[tool.id],
            }))}
            className="w-full flex items-center gap-2 p-2 hover:bg-neutral-50"
          >
            {/* 状态图标 */}
            {tool.status === 'running' && <Loader2 className="animate-spin" />}
            {tool.status === 'success' && <Check className="text-green-500" />}
            {tool.status === 'error' && <X className="text-red-500" />}

            {/* 工具名称 */}
            <span className="font-medium">{tool.displayName}</span>

            {/* 展开/收起图标 */}
            {expanded[tool.id] ? <ChevronDown /> : <ChevronRight />}
          </button>

          {/* 详情面板 */}
          {expanded[tool.id] && (
            <div className="p-3 bg-neutral-50 border-t">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(tool.output ?? tool.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ReAct 决策流程

```
用户："东京明天天气怎么样？"
         │
         ▼
┌─────────────────────────────────────┐
│  Thought（思考）                     │
│  "需要查询东京的天气信息"            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Action（行动）                      │
│  调用 amap_weather 工具              │
│  参数: { city: "东京" }              │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Observation（观察）                 │
│  工具返回: "晴，25°C，湿度60%"       │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Final Answer（最终回答）            │
│  "东京明天天气晴朗，气温25°C..."     │
└─────────────────────────────────────┘
```

---

## 工具显示名称映射

**`src/lib/langchain/tools/index.ts`**

```typescript
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_current_date: '获取当前日期',
  amap_maps_maps_geo: '地理编码查询',
  amap_maps_maps_weather: '天气查询',
  amap_maps_maps_text_search: '地点搜索',
  variflight_flight_search: '航班查询',
};

export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] ?? toolName;
}
```

---

## 验收标准

- ✅ 问"今天是几号"能返回正确日期
- ✅ 问"东京今天天气"能返回真实数据
- ✅ 问"北京到上海的航班"能返回航班信息
- ✅ AI 能自动判断何时需要调用工具
- ✅ 工具调用步骤正确展示

---

## 学习要点

1. **Function Calling 原理** - LLM 如何决定调用哪个工具
2. **ReAct Agent** - Thought → Action → Observation 循环
3. **MCP 协议** - Model Context Protocol 工具集成
4. **streamEvents** - Agent 事件流的监听和处理
5. **前端状态管理** - 工具调用状态的实时展示

---

## 相关文档

- OpenSpec Change: `openspec/changes/archive/2026-01-26-add-tool-calling/`
- 工具定义: `src/lib/langchain/tools/`
- MCP 客户端: `src/lib/langchain/mcp-client.ts`

---

_文档创建时间：2026-01-27_
