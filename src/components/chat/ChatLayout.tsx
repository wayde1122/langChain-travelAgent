'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useChatStore } from '@/store';

// 模拟会话数据
const mockConversations = [
  { id: '1', title: '日本旅行规划', updatedAt: new Date() },
  {
    id: '2',
    title: '北京景点推荐',
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    title: '签证办理咨询',
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
];

export function ChatLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const { clearMessages } = useChatStore();

  const handleNewChat = () => {
    setCurrentConversationId(undefined);
    clearMessages();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    // TODO: 加载对应会话的消息
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={mockConversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-hidden">
        <ChatArea />
      </main>
    </div>
  );
}
