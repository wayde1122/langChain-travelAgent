'use client';

import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

import type { ApiMessage } from '@/types';

/**
 * 聊天区域组件
 * 包含消息列表、输入框和欢迎屏幕
 * 支持流式输出
 */
export function ChatArea() {
  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    removeMessagesFrom,
    setLoading,
    setError,
  } = useChatStore();

  // 正在重新生成的消息 ID
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // 是否正在流式传输
  const [isStreaming, setIsStreaming] = useState(false);

  // 当前流式消息的 ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // 当前累积的内容
  const accumulatedContentRef = useRef<string>('');

  // 取消函数引用
  const cancelRef = useRef<(() => void) | null>(null);

  /**
   * 发送消息（流式）
   * @param content - 消息内容
   * @param historyMessages - 可选的历史消息（用于重新生成时指定历史）
   */
  const handleSend = useCallback(
    async (content: string, historyMessages?: ApiMessage[]) => {
      // 添加用户消息（重新生成时不需要添加）
      if (!historyMessages) {
        addMessage({ role: 'user', content });
      }

      setLoading(true);
      setError(null);

      // 重置流式状态
      accumulatedContentRef.current = '';
      streamingMessageIdRef.current = null;

      try {
        // 构建历史消息
        const history: ApiMessage[] =
          historyMessages ??
          messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        // 先添加一个空的 AI 消息占位
        addMessage({ role: 'assistant', content: '' });
        setIsStreaming(true);

        // 获取刚添加的消息 ID（最后一条消息）
        // 注意：这里需要在下一个 tick 获取，因为 addMessage 是异步的
        await new Promise((resolve) => setTimeout(resolve, 0));

        const currentMessages = useChatStore.getState().messages;
        const assistantMessage = currentMessages[currentMessages.length - 1];
        streamingMessageIdRef.current = assistantMessage.id;

        // 创建可取消的流式请求
        const [sendStreamMessage, cancel] =
          chatService.createCancellableStreamSend();
        cancelRef.current = cancel;

        // 发送流式请求
        await sendStreamMessage(content, history, {
          onContent: (chunk) => {
            // 累积内容并更新消息
            accumulatedContentRef.current += chunk;
            if (streamingMessageIdRef.current) {
              updateMessage(
                streamingMessageIdRef.current,
                accumulatedContentRef.current
              );
            }
          },
          onDone: () => {
            // 流式传输完成
            setLoading(false);
            setIsStreaming(false);
            setRegeneratingId(null);
            streamingMessageIdRef.current = null;
            cancelRef.current = null;
          },
          onError: (error) => {
            // 处理错误
            setError(error);
            if (streamingMessageIdRef.current) {
              updateMessage(
                streamingMessageIdRef.current,
                accumulatedContentRef.current || `抱歉，发生了错误：${error}`
              );
            }
            setLoading(false);
            setIsStreaming(false);
            setRegeneratingId(null);
            streamingMessageIdRef.current = null;
            cancelRef.current = null;
          },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '网络错误';
        setError(errorMsg);
        if (streamingMessageIdRef.current) {
          updateMessage(
            streamingMessageIdRef.current,
            '抱歉，网络出现问题，请稍后再试。'
          );
        }
        setLoading(false);
        setIsStreaming(false);
        setRegeneratingId(null);
        streamingMessageIdRef.current = null;
        cancelRef.current = null;
      }
    },
    [messages, addMessage, updateMessage, setLoading, setError]
  );

  /**
   * 重新生成 AI 回复
   * @param messageId - 要重新生成的 AI 消息 ID
   */
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      // 取消正在进行的请求
      if (cancelRef.current) {
        cancelRef.current();
      }

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
    },
    [messages, removeMessagesFrom, handleSend]
  );

  /**
   * 停止生成
   */
  const handleStop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);
    streamingMessageIdRef.current = null;
  }, [setLoading]);

  /** 处理建议点击 */
  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

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
          isLoading={isLoading && !isStreaming}
          regeneratingId={regeneratingId}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={isLoading}
        isStreaming={isStreaming}
      />
    </div>
  );
}
