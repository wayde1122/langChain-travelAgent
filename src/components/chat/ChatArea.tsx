'use client';

import { useState, useRef, useCallback } from 'react';
import { Loader2, Menu } from 'lucide-react';

import { useChatStore } from '@/store';
import { chatService } from '@/services';
import { Button } from '@/components/ui/button';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

import type { ApiMessage, ToolCallStep } from '@/types';
import type { MessageWithTools } from '@/store/chat-store';

interface ChatAreaProps {
  /** 消息发送完成后的回调，用于持久化 */
  onMessageSent?: (
    userMessage: string,
    assistantMessage: MessageWithTools
  ) => void;
  /** 是否正在加载历史消息 */
  isLoadingHistory?: boolean;
  /** 打开移动端侧边栏的回调 */
  onOpenMobileSidebar?: () => void;
}

/**
 * 聊天区域组件
 * 包含消息列表、输入框和欢迎屏幕
 * 支持 Agent 流式输出和工具调用展示
 */
export function ChatArea({
  onMessageSent,
  isLoadingHistory = false,
  onOpenMobileSidebar,
}: ChatAreaProps) {
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

  // 待填充到输入框的建议内容
  const [pendingSuggestion, setPendingSuggestion] = useState<
    string | undefined
  >(undefined);

  // 当前流式消息的 ID
  const streamingMessageIdRef = useRef<string | null>(null);

  // 取消函数引用
  const cancelRef = useRef<(() => void) | null>(null);

  // 当前用户消息内容（用于回调）
  const currentUserMessageRef = useRef<string>('');

  /**
   * 发送消息（Agent 流式）
   * @param content - 消息内容
   * @param historyMessages - 可选的历史消息（用于重新生成时指定历史）
   */
  const handleSend = useCallback(
    async (content: string, historyMessages?: ApiMessage[]) => {
      // 保存用户消息内容
      currentUserMessageRef.current = content;

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

              // 调用持久化回调
              if (onMessageSent) {
                const currentMessages = useChatStore.getState().messages;
                const assistantMsg = currentMessages.find(
                  (m) => m.id === streamingMessageIdRef.current
                );
                if (assistantMsg) {
                  onMessageSent(currentUserMessageRef.current, assistantMsg);
                }
              }
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
      onMessageSent,
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

  /** 处理建议点击 - 填充到输入框 */
  const handleSuggestionClick = useCallback((text: string) => {
    setPendingSuggestion(text);
  }, []);

  /** 清除待填充的建议 */
  const handleSuggestionConsumed = useCallback(() => {
    setPendingSuggestion(undefined);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* 移动端汉堡菜单 */}
          {onOpenMobileSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={onOpenMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <span className="font-medium text-neutral-900">Travel Assistant</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            (Agent Mode)
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoadingHistory ? (
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6 animate-in fade-in duration-200">
            {/* 骨架屏 - 模拟消息加载 */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                {/* 用户消息骨架 */}
                <div className="flex justify-end">
                  <div className="max-w-[70%] space-y-2">
                    <div
                      className="h-4 rounded-full bg-neutral-200 animate-pulse"
                      style={{ width: `${60 + i * 10}%` }}
                    />
                  </div>
                </div>
                {/* AI 消息骨架 */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-full bg-neutral-200 animate-pulse" />
                    <div className="h-4 w-full rounded-full bg-neutral-200 animate-pulse" />
                    <div className="h-4 w-2/3 rounded-full bg-neutral-200 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
            {/* 加载提示 */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground pt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">加载对话历史...</span>
            </div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden animate-in fade-in duration-300">
          <MessageList
            messages={messages}
            isLoading={isLoading && !isStreamingLocal}
            regeneratingId={regeneratingId}
            onRegenerate={handleRegenerate}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        disabled={isLoading}
        isStreaming={isStreamingLocal}
        externalValue={pendingSuggestion}
        onExternalValueConsumed={handleSuggestionConsumed}
      />
    </div>
  );
}
