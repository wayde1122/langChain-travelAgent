# Tasks: 添加用户认证和对话持久化

## 1. 环境搭建

- [x] 1.1 创建 Supabase 项目
- [x] 1.2 安装依赖 (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] 1.3 配置环境变量 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [x] 1.4 创建 Supabase 客户端 (`src/lib/supabase/client.ts`, `server.ts`)
- [x] 1.5 执行数据库迁移（创建 sessions、messages 表和 RLS 策略）

## 2. 用户认证

- [x] 2.1 创建 `AuthProvider` 组件 (`src/components/auth/AuthProvider.tsx`)
- [x] 2.2 创建登录页面 (`src/app/auth/login/page.tsx`)
- [x] 2.3 创建注册页面 (`src/app/auth/signup/page.tsx`)
- [x] 2.4 创建 `UserMenu` 组件 (`src/components/auth/UserMenu.tsx`)
- [x] 2.5 配置 Auth 中间件 (`middleware.ts`)
- [x] 2.6 更新根布局集成 AuthProvider

## 3. 对话持久化

- [x] 3.1 扩展 `chat-store.ts` 添加 `currentSessionId` 状态（在 session-store 中）
- [x] 3.2 创建 `session-store.ts` 管理会话列表
- [x] 3.3 创建 `services/session.ts` 会话 CRUD 服务
- [x] 3.4 ~~创建会话 API 路由~~ → 改为直接调用 Supabase 客户端
- [x] 3.5 ~~创建单个会话 API~~ → 改为直接调用 Supabase 客户端
- [x] 3.6 修改聊天 API 支持 session_id 参数（通过前端 service 实现）
- [x] 3.7 发送消息时自动保存到数据库
- [x] 3.8 新对话自动创建 session

## 4. 历史会话管理 UI

- [x] 4.1 创建 `SessionList` 侧边栏组件（集成在 Sidebar 中）
- [x] 4.2 创建 `SessionItem` 单条会话组件（ConversationItem）
- [x] 4.3 创建 `NewSessionButton` 组件（集成在 Sidebar 中）
- [x] 4.4 实现切换会话（加载历史消息）
- [x] 4.5 实现删除会话
- [x] 4.6 实现重命名会话
- [x] 4.7 实现根据首条消息生成会话标题
- [x] 4.8 移动端侧边栏适配（Sheet 抽屉）

> 注：当前版本未登录用户可以正常使用，但对话不会持久化。本地存储兼容作为增强功能推迟实现。

## 6. 测试验证

- [x] 6.1 手动测试注册/登录/登出流程
- [x] 6.2 测试对话保存和加载
- [x] 6.3 测试会话列表和切换
- [x] 6.4 测试删除会话
- [x] 6.5 测试未登录模式
- [x] 6.6 测试数据隔离（RLS 策略保证）

## 7. 文档更新

- [x] 7.1 更新 ROADMAP.md 持久化部分
- [x] 7.2 更新 ARCHITECTURE.md 添加数据库架构
- [x] 7.3 更新 .env.example 添加 Supabase 变量（在 ARCHITECTURE.md 中说明）

---

**完成时间**: 2026-01-27

**主要成果**:

- 用户可以注册、登录、登出
- 对话自动保存到 Supabase PostgreSQL
- 刷新页面后对话不丢失
- 历史会话列表和管理功能
- 移动端响应式侧边栏
- Row Level Security 数据隔离
