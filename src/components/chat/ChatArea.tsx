'use client';

import { useChatStore } from '@/store';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

import type { ChatApiResponse, ApiMessage } from '@/types';

export function ChatArea() {
  const { messages, isLoading, addMessage, setLoading, setError } =
    useChatStore();

  const handleSend = async (content: string) => {
    // 添加用户消息
    addMessage({ role: 'user', content });
    setLoading(true);
    setError(null);

    try {
      // 构建历史消息（排除刚添加的用户消息）
      const history: ApiMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });

      const data: ChatApiResponse = await response.json();

      if (data.success) {
        addMessage({
          role: 'assistant',
          content: data.message,
        });
      } else {
        setError(data.error);
        addMessage({
          role: 'assistant',
          content: `抱歉，发生了错误：${data.error}`,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      setError(errorMsg);
      addMessage({
        role: 'assistant',
        content: '抱歉，网络出现问题，请稍后再试。',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
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
