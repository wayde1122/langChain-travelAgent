# 规范：聊天 API

> 定义 `/api/chat` 端点的行为规范

---

## 端点信息

- **路径**: `POST /api/chat`
- **用途**: 处理用户消息，返回 AI 回复

---

## 请求

### 请求体

```typescript
interface ChatRequest {
  messages: Message[];
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### 示例

```json
{
  "messages": [
    { "role": "user", "content": "北京有什么好玩的？" }
  ]
}
```

---

## 响应

### 阶段 1（同步）

```typescript
interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
}
```

### 阶段 2（流式）

```
Content-Type: text/event-stream

data: {"content": "北"}
data: {"content": "京"}
...
data: [DONE]
```

---

## 错误处理

| 状态码 | 场景 | 响应 |
|--------|------|------|
| 400 | 请求体无效 | `{ "error": { "code": "INVALID_REQUEST", "message": "..." } }` |
| 401 | API Key 无效 | `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }` |
| 429 | 请求过多 | `{ "error": { "code": "RATE_LIMITED", "message": "..." } }` |
| 500 | 服务器错误 | `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }` |

---

## 验证规则

- `messages` 必须是非空数组
- 每条消息必须有 `role` 和 `content`
- `content` 最大长度：4000 字符
- `messages` 最大数量：50 条

---

## System Prompt

旅行助手的角色设定（见 `lib/langchain/prompts.ts`）：
- 专业旅行顾问身份
- 只回答旅行相关问题
- 友好、专业的语气

---

*最后更新：2026-01-22*
