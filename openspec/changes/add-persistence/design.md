# Design: 用户认证和对话持久化

## Context

旅行助手需要持久化功能来保存用户对话历史，提升产品价值和用户粘性。需要在开发效率、技术复杂度和未来扩展性之间做平衡。

## Goals / Non-Goals

**Goals:**

- 用户可以注册、登录、登出
- 对话自动保存到云端数据库
- 刷新页面后对话不丢失
- 可以查看和切换历史会话
- 不同用户数据完全隔离

**Non-Goals:**

- 多用户协作/分享对话（后续扩展）
- 对话搜索功能（后续扩展）
- 对话导出/导入（后续扩展）

## Decisions

### 1. 认证方案：Supabase Auth

**决定**: 使用 Supabase Auth 而非 NextAuth.js

**原因**:

- 与 Supabase Database 深度集成，开发效率高
- Row Level Security (RLS) 自动实现用户数据隔离
- 开箱即用的邮箱/OAuth 认证
- 与后续 pgvector 方向一致（RAG 阶段）

**备选方案**:

- NextAuth.js：更灵活但需要自己管理数据库 Session，增加复杂度

### 2. 数据库：Supabase PostgreSQL

**决定**: 使用 Supabase 托管的 PostgreSQL

**原因**:

- 免费额度足够学习和小规模使用
- 实时订阅功能可用于未来扩展
- 与 Auth 集成，RLS 策略简单
- 支持 pgvector 扩展（RAG 阶段）

### 3. 数据模型

```sql
-- 会话表
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,  -- 存储工具调用步骤
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 4. 安全策略：Row Level Security

```sql
-- 启用 RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的会话
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- 用户只能访问自己会话中的消息
CREATE POLICY "Users can manage messages in own sessions" ON messages
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );
```

### 5. 未登录用户处理

**决定**: 支持匿名模式，数据存储在 localStorage

**流程**:

1. 未登录用户可以正常使用聊天功能
2. 对话数据暂存 localStorage
3. 登录后提示是否导入本地对话到云端
4. 导入后清理 localStorage

### 6. UI 布局

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo                               UserMenu            │
├───────────────┬─────────────────────────────────────────────────┤
│               │                                                 │
│  SessionList  │             ChatArea                            │
│  (240px)      │             (flex-1)                            │
│               │                                                 │
│  [+ 新对话]   │                                                 │
│  ─────────    │                                                 │
│  会话 1       │                                                 │
│  会话 2       │                                                 │
│  ...          │                                                 │
│               │                                                 │
└───────────────┴─────────────────────────────────────────────────┘

移动端：侧边栏收起为抽屉 (Sheet 组件)
```

## Risks / Trade-offs

| 风险              | 影响 | 缓解措施                       |
| ----------------- | ---- | ------------------------------ |
| Supabase 服务依赖 | 高   | 抽象数据访问层，便于迁移       |
| RLS 策略复杂度    | 中   | 保持简单的用户隔离模型         |
| 本地/云端数据同步 | 中   | 登录时一次性导入，不做实时同步 |
| 免费额度限制      | 低   | 监控用量，设置消息数量上限     |

## Migration Plan

1. 安装 Supabase 依赖，配置环境变量
2. 执行数据库迁移脚本
3. 实现认证流程（不影响现有功能）
4. 实现会话持久化（可选开启）
5. 实现历史会话 UI
6. 全量切换到持久化模式

**回滚方案**: 每个步骤独立可回滚，认证和持久化可通过环境变量开关

## Open Questions

1. 是否需要支持第三方 OAuth（GitHub、Google）？
2. 会话标题是手动编辑还是 AI 自动生成？
3. 历史会话是否需要分页或虚拟滚动？
