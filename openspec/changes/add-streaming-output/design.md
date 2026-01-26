# Design: 流式输出技术设计

## Context

需要为聊天功能添加流式输出支持，提升用户体验。涉及后端 API、LangChain 调用、前端状态管理多个层面的改动。

## Goals / Non-Goals

**Goals:**

- 实现打字机效果的流式输出
- 保持向后兼容（非流式接口仍可用）
- 支持请求取消
- 良好的错误处理

**Non-Goals:**

- WebSocket 双向通信（SSE 足够）
- 消息部分重试（整条重新生成）

## Decisions

### Decision 1: 使用 SSE 而非 WebSocket

**选择**: Server-Sent Events (SSE)

**原因**:

- 单向通信场景，SSE 更简单
- 浏览器原生支持，无需额外库
- HTTP/2 下性能良好
- Next.js Route Handler 原生支持

**替代方案**: WebSocket

- 优点：双向通信、更低延迟
- 缺点：复杂度高、需要额外维护连接状态

### Decision 2: SSE 消息格式

```
data: {"content": "..."}\n\n  // 内容块
data: {"done": true}\n\n      // 完成标记
data: {"error": "..."}\n\n    // 错误信息
```

**原因**:

- JSON 格式便于解析
- 分离内容、完成、错误三种状态
- 符合 SSE 规范

### Decision 3: 前端状态更新策略

**选择**: 先创建空消息，再增量更新

**流程**:

1. `addMessage({ role: 'assistant', content: '' })` 创建占位
2. 获取消息 ID
3. `updateMessage(id, accumulatedContent)` 增量更新

**原因**:

- 复用现有 Zustand store 的 `updateMessage` action
- 避免在流式过程中频繁创建/删除消息
- 消息 ID 稳定，便于后续操作（如重新生成）

### Decision 4: LangChain 流式调用

```typescript
const stream = await chain.stream({ input, history });
// 转换为文本流
const textStream = stream.pipeThrough(
  new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk.content);
    },
  })
);
```

**原因**:

- LangChain 原生支持 `.stream()` 方法
- `TransformStream` 标准 Web API，无需额外依赖
- 可迭代流便于 `for await...of` 消费

## Risks / Trade-offs

| 风险               | 缓解措施                         |
| ------------------ | -------------------------------- |
| SSE 连接超时       | 设置合理的超时时间，前端处理重连 |
| 流式过程中断       | 保留已收到的内容，显示错误提示   |
| 内存占用（长回复） | 限制单次回复长度（maxTokens）    |
| 并发流请求         | 取消上一次请求后再发起新请求     |

## Migration Plan

无需迁移。新增 `stream=true` 参数，默认为 `false`，完全向后兼容。

## 交互细节

### 流式输出状态

| 状态             | 发送按钮             | 输入框 | 消息区域            |
| ---------------- | -------------------- | ------ | ------------------- |
| 空闲             | 蓝色发送按钮         | 可输入 | 显示历史消息        |
| 流式传输中       | 红色停止按钮（方形） | 禁用   | AI 消息实时更新内容 |
| 加载中（非流式） | 禁用                 | 禁用   | 显示加载指示器      |

### 停止生成行为

- 点击停止按钮后，取消当前请求
- 已生成的内容保留在消息中
- 界面恢复到空闲状态，可继续发送新消息

### 重新生成行为

- 点击重新生成时，先取消正在进行的请求（如有）
- 删除当前 AI 消息及之后的消息
- 使用相同的用户输入重新发起流式请求

## Open Questions

- [x] 是否需要添加流式传输的单元测试？→ 暂不需要，手动测试已验证
- [x] 是否需要在 UI 上显示"正在输入"指示器？→ 已通过停止按钮状态体现
