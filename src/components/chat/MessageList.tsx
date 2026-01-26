'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './MessageItem';
import { LoadingIndicator } from './LoadingIndicator';

import type { Message } from '@/types';

interface MessageListProps {
  /** 消息列表 */
  messages: Message[];
  /** 是否正在加载新消息 */
  isLoading?: boolean;
  /** 正在重新生成的消息 ID */
  regeneratingId?: string | null;
  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void;
}

/**
 * 消息列表组件
 * 显示消息列表，支持自动滚动、加载状态和重新生成
 */
export function MessageList({
  messages,
  isLoading = false,
  regeneratingId = null,
  onRegenerate,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingId === message.id}
          />
        ))}

        {isLoading && <LoadingIndicator />}

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
