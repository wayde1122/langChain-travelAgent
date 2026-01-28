# Change: 添加可点击建议按钮

## Why

当前 AI 助手在回复末尾提供的建议选项只是纯文本，用户需要手动复制或重新输入才能继续对话。这增加了交互成本，降低了用户体验。

## What Changes

- 修改系统提示词，让 AI 使用特殊链接语法 `[文本](suggest:内容)` 输出建议
- 扩展 MarkdownRenderer 组件，识别 `suggest:` 前缀的链接并渲染为可点击按钮
- 添加点击事件，将建议内容自动填充到输入框
- 支持在消息列表中任意 AI 消息的建议都可点击

## Impact

- Affected specs: `chat-ui` (新增)
- Affected code:
  - `src/lib/langchain/prompts.ts` - 添加建议格式说明
  - `src/components/chat/MarkdownRenderer.tsx` - 扩展链接渲染逻辑
  - `src/components/chat/MessageList.tsx` - 传递建议点击回调
  - `src/components/chat/MessageItem.tsx` - 传递建议点击回调
  - `src/components/chat/ChatArea.tsx` - 提供建议点击处理函数
