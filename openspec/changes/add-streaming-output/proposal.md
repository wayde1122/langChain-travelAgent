# Change: 添加流式输出支持

## Why

当前聊天响应采用一次性返回的方式，用户需要等待 AI 完整生成回复后才能看到内容。这导致：

- 较长回复时用户体验差，需要长时间等待
- 无法感知 AI 正在处理中的进度
- 与主流 AI 聊天产品（ChatGPT、Claude）的交互体验存在差距

## What Changes

- 后端 API 支持 SSE (Server-Sent Events) 流式响应
- LangChain 调用方式从 `invoke()` 改为 `stream()`
- 前端支持增量更新消息内容
- 保留非流式接口以兼容现有调用

## Impact

- Affected specs: `chat-api`
- Affected code:
  - `src/lib/langchain/chain.ts` - 添加 `chatStream` 函数
  - `src/app/api/chat/route.ts` - 支持流式响应
  - `src/services/chat.ts` - 添加流式请求方法
  - `src/components/chat/ChatArea.tsx` - 实时更新消息
  - `src/types/chat.ts` - 添加 `stream` 字段
