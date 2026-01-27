'use client';

import { useState, useEffect, useCallback } from 'react';

import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useAuth } from '@/components/auth';
import { useChatStore, useSessionStore } from '@/store';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  getSessions,
  getSessionMessages,
  createSession,
  deleteSession,
  updateSessionTitle,
  generateSessionTitle,
  saveMessage,
} from '@/services/session';

import type { MessageWithTools } from '@/store/chat-store';

export function ChatLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { user } = useAuth();

  const {
    sessions,
    currentSessionId,
    isLoading: isLoadingSessions,
    setSessions,
    addSession,
    removeSession,
    updateSession,
    setCurrentSessionId,
    setLoading: setSessionLoading,
  } = useSessionStore();

  const { clearMessages, addMessage } = useChatStore();

  // 加载会话列表（仅在用户 ID 变化时执行，避免切屏重复请求）
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      return;
    }

    const loadSessions = async () => {
      setSessionLoading(true);
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 新建对话
  const handleNewChat = useCallback(async () => {
    setCurrentSessionId(null);
    clearMessages();
    setMobileSheetOpen(false); // 关闭移动端侧边栏
  }, [setCurrentSessionId, clearMessages]);

  // 选择会话
  const handleSelectConversation = useCallback(
    async (id: string) => {
      if (id === currentSessionId) return;

      setCurrentSessionId(id);
      clearMessages();
      setIsLoadingMessages(true);
      setMobileSheetOpen(false); // 关闭移动端侧边栏

      try {
        const msgs = await getSessionMessages(id);
        // 将持久化消息转换为前端消息格式
        msgs.forEach((msg) => {
          addMessage({
            role: msg.role,
            content: msg.content,
            // toolCalls 从数据库恢复时转换类型
            toolCalls: msg.toolCalls?.map((tc) => ({
              id: tc.id,
              name: tc.name,
              displayName: tc.displayName,
              input: tc.args,
              output: tc.result,
              status: tc.status === 'completed' ? 'success' : tc.status,
              error: tc.error,
            })) as MessageWithTools['toolCalls'],
          });
        });
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentSessionId, setCurrentSessionId, clearMessages, addMessage]
  );

  // 删除会话
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteSession(id);
        removeSession(id);
        if (id === currentSessionId) {
          clearMessages();
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    },
    [currentSessionId, removeSession, clearMessages]
  );

  // 重命名会话
  const handleRenameConversation = useCallback(
    async (id: string, newTitle: string) => {
      try {
        await updateSessionTitle(id, newTitle);
        updateSession(id, { title: newTitle });
      } catch (error) {
        console.error('Failed to rename session:', error);
      }
    },
    [updateSession]
  );

  // 发送消息后保存到数据库
  const handleMessageSent = useCallback(
    async (userMessage: string, assistantMessage: MessageWithTools) => {
      if (!user) return; // 未登录不保存

      try {
        let sessionId = currentSessionId;

        // 如果没有当前会话，创建新会话
        if (!sessionId) {
          const title = generateSessionTitle(userMessage);
          const session = await createSession(title);
          sessionId = session.id;
          addSession(session);
          setCurrentSessionId(sessionId);
        }

        // 保存用户消息
        await saveMessage(sessionId, 'user', userMessage);

        // 保存助手消息
        await saveMessage(
          sessionId,
          'assistant',
          assistantMessage.content,
          assistantMessage.toolCalls
        );
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    },
    [user, currentSessionId, addSession, setCurrentSessionId]
  );

  // 转换会话格式供 Sidebar 使用
  const conversations = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt,
  }));

  // Sidebar 的通用 props
  const sidebarProps = {
    conversations,
    currentConversationId: currentSessionId ?? undefined,
    isLoading: isLoadingSessions,
    onNewChat: handleNewChat,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation: handleDeleteConversation,
    onRenameConversation: handleRenameConversation,
  };

  return (
    <div className="flex h-screen">
      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          {...sidebarProps}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* 移动端侧边栏 (Sheet) */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-neutral-900 border-neutral-800"
          hideCloseButton
        >
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          <Sidebar
            {...sidebarProps}
            collapsed={false}
            onToggleCollapse={() => setMobileSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-hidden">
        <ChatArea
          onMessageSent={handleMessageSent}
          isLoadingHistory={isLoadingMessages}
          onOpenMobileSidebar={() => setMobileSheetOpen(true)}
        />
      </main>
    </div>
  );
}
