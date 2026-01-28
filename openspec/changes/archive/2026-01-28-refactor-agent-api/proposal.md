# Change: 重构 Agent API - 从 createReactAgent 迁移到 createAgent

## Why

`createReactAgent` (`@langchain/langgraph/prebuilt`) 已被 LangChain 废弃，需要迁移到新的 `createAgent` (`langchain`) API 以获得：

- 更简洁的 API（`systemPrompt` 字符串替代 `ChatPromptTemplate`）
- 内置 Middleware 支持（摘要、HITL、PII 过滤等）
- 更好的流式处理和状态管理
- 持续获得官方维护和更新

## What Changes

- **导入源变更**：从 `@langchain/langgraph/prebuilt` 改为 `langchain`
- **提示词参数**：`prompt` (ChatPromptTemplate) 改为 `systemPrompt` (字符串)
- **流式处理**：从 `streamEvents()` 改为 `stream()`
- **代码简化**：移除 `createAgentPrompt` 函数，改用简单的字符串拼接

## Impact

- **Affected specs**: agent-tools (ReAct Agent Loop 实现细节)
- **Affected code**: `src/lib/langchain/agent.ts`
- **无破坏性变更**：外部 API 行为保持不变，仅内部实现技术栈更新
