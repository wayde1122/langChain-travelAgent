'use client';

import { useChatStore } from '@/store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

export function ChatArea() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore();

  const handleSend = async (content: string) => {
    // 添加用户消息
    addMessage({ role: 'user', content });
    setLoading(true);

    try {
      // TODO: 调用后端 API
      // 模拟 AI 回复
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addMessage({
        role: 'assistant',
        content: `这是一条模拟回复。你问的是：「${content}」\n\n后续将接入真实的 AI 服务。`,
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后再试。',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">Travel Assistant</span>
        </div>
      </div>

      {/* Content */}
      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
