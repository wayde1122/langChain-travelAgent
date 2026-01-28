# Design: refactor-agent-api

## Context

LangChain 在 2026 年初发布了新的 `createAgent` API，废弃了原有的 `createReactAgent`。新 API 提供更简洁的接口和更强大的功能。

## Goals / Non-Goals

**Goals:**

- 迁移到官方推荐的 `createAgent` API
- 简化代码结构，移除不必要的模板构建逻辑
- 保持现有功能完全兼容

**Non-Goals:**

- 不添加 Middleware 功能（后续迭代）
- 不改变外部 API 接口
- 不修改 RAG 检索逻辑

## Decisions

### 1. API 迁移方案

| 特性   | 旧 API                          | 新 API                 |
| ------ | ------------------------------- | ---------------------- |
| 包     | `@langchain/langgraph/prebuilt` | `langchain`            |
| 函数   | `createReactAgent`              | `createAgent`          |
| 提示词 | `prompt: ChatPromptTemplate`    | `systemPrompt: string` |
| 模型   | `llm: ChatModel`                | `model: ChatModel`     |
| 流式   | `streamEvents()`                | `stream()`             |

### 2. 提示词处理简化

```typescript
// 旧：需要构建 ChatPromptTemplate
function createAgentPrompt(ragContext?: RetrievalContext): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    ['system', promptWithContext],
    new MessagesPlaceholder('messages'),
  ]);
}

// 新：直接返回字符串
function getSystemPrompt(ragContext?: RetrievalContext): string {
  if (ragContext?.hasResults) {
    return RAG_AGENT_SYSTEM_PROMPT.replace(
      '{context}',
      ragContext.formattedContext
    );
  }
  return TRAVEL_AGENT_SYSTEM_PROMPT;
}
```

### 3. 流式处理调整

新 API 的 `stream()` 方法输出格式更简洁，需要调整事件解析逻辑以适配现有的前端事件格式。

## Risks / Trade-offs

| 风险                    | 缓解措施                                   |
| ----------------------- | ------------------------------------------ |
| 新 API 流式输出格式不同 | 调整事件解析逻辑，保持前端接口不变         |
| 自定义模型兼容性        | 新 API 支持传入模型实例，无需改动 model.ts |

## Migration Plan

1. 更新导入和函数签名
2. 调整流式处理逻辑
3. 运行测试验证
4. 手动测试功能

## Open Questions

- 是否在后续迭代中引入 Middleware 功能？
