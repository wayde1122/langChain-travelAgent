'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { User, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToPdf } from '@/lib/utils/export-pdf';
import { MarkdownRenderer } from './MarkdownRenderer';

import type { Message } from '@/types';

interface MessageItemProps {
  /** 消息对象 */
  message: Message;
  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否正在加载（重新生成中） */
  isRegenerating?: boolean;
}

/**
 * 消息项组件
 * 显示单条消息，AI 消息支持 Markdown 渲染、重新生成和导出 PDF
 */
export function MessageItem({
  message,
  onRegenerate,
  showActions = true,
  isRegenerating = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  /** 处理导出 PDF */
  const handleExportPdf = () => {
    const html = contentRef.current?.innerHTML ?? message.content;
    exportToPdf({
      content: html,
      extractItinerary: true, // 只导出行程相关内容
    });
  };

  /** 处理重新生成 */
  const handleRegenerate = () => {
    onRegenerate?.(message.id);
  };

  return (
    <div className="group mb-6">
      <div
        className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
            <User className="h-4 w-4 text-neutral-600" />
          </div>
        ) : (
          <Image
            src="/travel-icon.jpg"
            alt="AI"
            width={32}
            height={32}
            className="shrink-0 rounded-full"
          />
        )}

        {/* Message Content */}
        <div className={cn('flex-1', isUser && 'flex justify-end')}>
          <div
            className={cn(
              'inline-block max-w-[85%] rounded-2xl px-4 py-2',
              isUser
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-transparent text-neutral-900'
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            ) : (
              <MarkdownRenderer ref={contentRef} content={message.content} />
            )}
          </div>

          {/* AI 消息操作按钮 */}
          {!isUser && showActions && (
            <div className="mt-2 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className={cn(
                  'flex cursor-pointer items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600',
                  isRegenerating && 'cursor-not-allowed opacity-50'
                )}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    isRegenerating && 'animate-spin'
                  )}
                />
                <span>{isRegenerating ? '生成中...' : '重新生成'}</span>
              </button>
              <button
                onClick={handleExportPdf}
                className="flex cursor-pointer items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600"
              >
                <Download className="h-3.5 w-3.5" />
                <span>导出 PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
