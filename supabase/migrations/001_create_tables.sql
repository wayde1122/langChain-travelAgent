-- 旅行助手数据库迁移脚本
-- 创建会话和消息表，配置 Row Level Security

-- ============================================
-- 1. 创建会话表
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 会话表注释
COMMENT ON TABLE public.sessions IS '用户对话会话';
COMMENT ON COLUMN public.sessions.user_id IS '关联的用户 ID';
COMMENT ON COLUMN public.sessions.title IS '会话标题';

-- ============================================
-- 2. 创建消息表
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 消息表注释
COMMENT ON TABLE public.messages IS '对话消息';
COMMENT ON COLUMN public.messages.role IS '消息角色: user/assistant/system';
COMMENT ON COLUMN public.messages.tool_calls IS '工具调用步骤 JSON';

-- ============================================
-- 3. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- 4. 启用 Row Level Security
-- ============================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 创建 RLS 策略
-- ============================================

-- 会话表策略：用户只能访问自己的会话
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 消息表策略：用户只能访问自己会话中的消息
CREATE POLICY "Users can view messages in own sessions"
  ON public.messages FOR SELECT
  USING (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create messages in own sessions"
  ON public.messages FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update messages in own sessions"
  ON public.messages FOR UPDATE
  USING (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete messages in own sessions"
  ON public.messages FOR DELETE
  USING (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));

-- ============================================
-- 6. 创建更新时间戳触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
