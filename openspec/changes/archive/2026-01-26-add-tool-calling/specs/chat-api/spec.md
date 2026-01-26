# Chat API Spec Delta

## ADDED Requirements

### Requirement: Agent Mode Support

系统 SHALL 支持 Agent 模式，允许 AI 在对话过程中调用外部工具获取实时信息。

#### Scenario: Enable agent mode via request parameter

- **WHEN** 请求包含 `useAgent: true` 参数
- **THEN** 使用 Agent 模式处理请求，可调用已注册的工具

#### Scenario: Default mode without agent parameter

- **WHEN** 请求不包含 `useAgent` 参数
- **THEN** 默认使用 Agent 模式（向后兼容）

---

### Requirement: Tool Call Response Format

系统 SHALL 在流式响应中支持工具调用事件。

#### Scenario: Streaming with tool calls

- **WHEN** Agent 在流式输出中调用工具
- **THEN** SSE 响应包含以下事件类型：
  - `{"type": "thinking", "content": "..."}` - 思考过程
  - `{"type": "tool_call", "name": "...", "input": {...}}` - 工具调用
  - `{"type": "tool_result", "name": "...", "result": "..."}` - 工具结果
  - `{"type": "content", "content": "..."}` - 最终内容
  - `{"done": true}` - 完成标记

#### Scenario: Non-streaming agent response

- **WHEN** 使用非流式 Agent 模式
- **THEN** 响应直接返回最终结果，工具调用细节在 `toolCalls` 字段中
