# Spec Delta: Chat API 流式输出

## ADDED Requirements

### Requirement: 流式聊天响应

系统 SHALL 支持流式返回 AI 聊天响应，通过 Server-Sent Events (SSE) 格式逐块传输内容。

#### Scenario: 启用流式输出

- **WHEN** 客户端发送 POST `/api/chat` 请求，body 包含 `stream: true`
- **THEN** 服务器返回 `Content-Type: text/event-stream`
- **AND** 响应以 SSE 格式逐块发送内容

#### Scenario: 流式内容块格式

- **WHEN** AI 生成内容时
- **THEN** 每个内容块以 `data: {"content": "..."}\n\n` 格式发送

#### Scenario: 流式完成标记

- **WHEN** AI 完成所有内容生成
- **THEN** 发送 `data: {"done": true}\n\n` 标记结束

#### Scenario: 流式错误处理

- **WHEN** 流式传输过程中发生错误
- **THEN** 发送 `data: {"error": "..."}\n\n` 并关闭连接

### Requirement: 流式请求取消

系统 SHALL 支持客户端取消正在进行的流式请求。

#### Scenario: 取消流式请求

- **WHEN** 客户端中止请求（AbortController.abort）
- **THEN** 服务器停止生成内容并关闭连接
- **AND** 客户端保留已接收的部分内容

#### Scenario: 停止生成按钮

- **WHEN** 流式传输正在进行中
- **THEN** 输入框区域显示红色停止按钮（替代发送按钮）
- **AND** 用户点击停止按钮时取消当前请求
- **AND** 已生成的内容保留在消息中

### Requirement: 前端流式消息更新

客户端 SHALL 支持增量更新消息内容以实现打字机效果。

#### Scenario: 流式消息显示

- **WHEN** 用户发送消息并启用流式模式
- **THEN** 界面先显示空的 AI 消息占位
- **AND** 随着内容块到达，消息内容逐步更新
- **AND** 用户可以实时看到 AI 的回复逐字出现

#### Scenario: 流式过程中重新生成

- **WHEN** 用户在流式传输过程中点击重新生成
- **THEN** 取消当前流式请求
- **AND** 删除当前消息
- **AND** 发起新的流式请求

## MODIFIED Requirements

### Requirement: 聊天 API 请求格式

系统 SHALL 接受包含可选 `stream` 参数的聊天请求。

#### Scenario: 非流式请求（默认）

- **WHEN** 客户端发送 POST `/api/chat`，body 为 `{"message": "...", "history": [...]}`
- **THEN** 服务器返回完整的 JSON 响应 `{"success": true, "message": "..."}`

#### Scenario: 流式请求

- **WHEN** 客户端发送 POST `/api/chat`，body 为 `{"message": "...", "history": [...], "stream": true}`
- **THEN** 服务器返回 SSE 流式响应
