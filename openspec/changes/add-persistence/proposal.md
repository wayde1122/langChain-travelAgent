# Change: 添加用户认证和对话持久化

## Why

当前应用的对话数据仅存储在前端内存中，刷新页面后所有对话历史丢失。这导致：

- 用户无法保存重要的旅行规划对话
- 无法在多设备间同步对话
- 长期使用价值受限，用户粘性不足

## What Changes

- **BREAKING**: 聊天 API 需要关联会话 ID
- 新增 Supabase Auth 用户认证系统
- 新增数据库表存储会话和消息
- 新增历史会话列表和管理功能
- 支持未登录用户的本地存储模式

## Impact

- Affected specs: 新增 `persistence` capability
- Affected code:
  - `src/lib/supabase/` - 新增 Supabase 客户端配置
  - `src/store/chat-store.ts` - 扩展支持 sessionId
  - `src/store/session-store.ts` - 新增会话列表状态管理
  - `src/services/session.ts` - 新增会话 CRUD 服务
  - `src/components/auth/` - 新增认证相关组件
  - `src/components/session/` - 新增会话管理组件
  - `src/app/api/sessions/` - 新增会话 API 路由
  - `src/app/(auth)/` - 新增登录/注册页面
  - `middleware.ts` - 新增 Auth 中间件
