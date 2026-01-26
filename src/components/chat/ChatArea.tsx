'use client';

import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

import type { ApiMessage, ToolCallStep } from '@/types';

/**
 * 聊天区域组件
 * 包含消息列表、输入框和欢迎屏幕
 * 支持 Agent 流式输出和工具调用展示
 */
export function ChatArea() {
  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    appendMessageContent,
    removeMessagesFrom,
    setLoading,
    setStreaming,
    setMessageStreaming,
    setError,
    addToolCall,
    updateToolCall,
  } = useChatStore();

  // 正在重新生成的消息 ID
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // 是否正在流式传输
  const [isStreamingLocal, setIsStreamingLocal] = useState(false);

  // 当前流式消息的 ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // 取消函数引用
  const cancelRef = useRef<(() => void) | null>(null);

  /**
   * 发送消息（Agent 流式）
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
        const messageId = addMessage({
          role: 'assistant',
          content: '',
          toolCalls: [],
          isStreaming: true,
        });
        streamingMessageIdRef.current = messageId;
        setIsStreamingLocal(true);
        setStreaming(true);

        // 创建可取消的 Agent 流式请求
        const [sendAgentStreamMessage, cancel] =
          chatService.createCancellableAgentStreamSend();
        cancelRef.current = cancel;

        // 发送 Agent 流式请求
        await sendAgentStreamMessage(content, history, {
          onThinking: () => {
            // 可以在这里更新思考状态
          },
          onToolStart: (id, name, displayName, input) => {
            // 添加工具调用步骤
            if (streamingMessageIdRef.current) {
              const toolCall: ToolCallStep = {
                id,
                name,
                displayName,
                input,
                status: 'running',
                startTime: new Date(),
              };
              addToolCall(streamingMessageIdRef.current, toolCall);
            }
          },
          onToolEnd: (id, name, output, error) => {
            // 更新工具调用结果
            if (streamingMessageIdRef.current) {
              updateToolCall(streamingMessageIdRef.current, id, {
                output,
                error,
                status: error ? 'error' : 'success',
                endTime: new Date(),
              });
            }
          },
          onContent: (chunk) => {
            // 追加内容
            if (streamingMessageIdRef.current) {
              appendMessageContent(streamingMessageIdRef.current, chunk);
            }
          },
          onDone: () => {
            // 流式传输完成
            if (streamingMessageIdRef.current) {
              setMessageStreaming(streamingMessageIdRef.current, false);
            }
            setLoading(false);
            setIsStreamingLocal(false);
            setStreaming(false);
            setRegeneratingId(null);
            streamingMessageIdRef.current = null;
            cancelRef.current = null;
          },
          onError: (error) => {
            // 处理错误
            setError(error);
            if (streamingMessageIdRef.current) {
              const currentMessages = useChatStore.getState().messages;
              const msg = currentMessages.find(
                (m) => m.id === streamingMessageIdRef.current
              );
              if (msg && !msg.content) {
                updateMessage(
                  streamingMessageIdRef.current,
                  `抱歉，发生了错误：${error}`
                );
              }
              setMessageStreaming(streamingMessageIdRef.current, false);
            }
            setLoading(false);
            setIsStreamingLocal(false);
            setStreaming(false);
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
          setMessageStreaming(streamingMessageIdRef.current, false);
        }
        setLoading(false);
        setIsStreamingLocal(false);
        setStreaming(false);
        setRegeneratingId(null);
        streamingMessageIdRef.current = null;
        cancelRef.current = null;
      }
    },
    [
      messages,
      addMessage,
      updateMessage,
      appendMessageContent,
      setLoading,
      setStreaming,
      setMessageStreaming,
      setError,
      addToolCall,
      updateToolCall,
    ]
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
    if (streamingMessageIdRef.current) {
      setMessageStreaming(streamingMessageIdRef.current, false);
    }
    setLoading(false);
    setIsStreamingLocal(false);
    setStreaming(false);
    streamingMessageIdRef.current = null;
  }, [setLoading, setStreaming, setMessageStreaming]);

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
          <span className="text-xs text-muted-foreground">(Agent Mode)</span>
        </div>
      </div>

      {/* Content */}
      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading && !isStreamingLocal}
          regeneratingId={regeneratingId}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={isLoading}
        isStreaming={isStreamingLocal}
      />
    </div>
  );
}
