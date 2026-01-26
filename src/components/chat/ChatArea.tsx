'use client';

import { useState } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

import type { ApiMessage } from '@/types';

/**
 * 聊天区域组件
 * 包含消息列表、输入框和欢迎屏幕
 */
export function ChatArea() {
  const {
    messages,
    isLoading,
    addMessage,
    removeMessagesFrom,
    setLoading,
    setError,
  } = useChatStore();

  // 正在重新生成的消息 ID
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  /**
   * 发送消息
   * @param content - 消息内容
   * @param historyMessages - 可选的历史消息（用于重新生成时指定历史）
   */
  const handleSend = async (
    content: string,
    historyMessages?: ApiMessage[]
  ) => {
    // 添加用户消息（重新生成时不需要添加）
    if (!historyMessages) {
      addMessage({ role: 'user', content });
    }

    setLoading(true);
    setError(null);

    try {
      // 构建历史消息
      const history: ApiMessage[] =
        historyMessages ??
        messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // 调用聊天服务
      const result = await chatService.sendMessage(content, history);

      if (result.success && result.data) {
        const data = result.data;
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
      } else {
        setError(result.error ?? '请求失败');
        addMessage({
          role: 'assistant',
          content: `抱歉，发生了错误：${result.error ?? '请求失败'}`,
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
      setRegeneratingId(null);
    }
  };

  /**
   * 重新生成 AI 回复
   * @param messageId - 要重新生成的 AI 消息 ID
   */
  const handleRegenerate = async (messageId: string) => {
    // 找到该消息在数组中的索引
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    // 找到该 AI 消息之前的最后一条用户消息
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) return;

    const userMessage = messages[userMessageIndex];

    // 构建历史消息（不包含要重新生成的消息及之后的消息）
    const history: ApiMessage[] = messages
      .slice(0, messageIndex)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // 设置重新生成状态
    setRegeneratingId(messageId);

    // 删除该消息及之后的所有消息
    removeMessagesFrom(messageId);

    // 重新发送用户消息
    await handleSend(userMessage.content, history);
  };

  /** 处理建议点击 */
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
        <MessageList
          messages={messages}
          isLoading={isLoading}
          regeneratingId={regeneratingId}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
