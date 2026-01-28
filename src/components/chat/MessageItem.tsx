'use client';

import Image from 'next/image';
import { User, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToMarkdown } from '@/lib/utils/export-markdown';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallSteps } from './ToolCallSteps';

import type { ToolCallStep } from '@/types';

interface MessageItemProps {
  /** 消息对象 */
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
    toolCalls?: ToolCallStep[];
    isStreaming?: boolean;
  };
  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否正在加载（重新生成中） */
  isRegenerating?: boolean;
}

/**
 * 消息项组件
 * 显示单条消息，AI 消息支持 Markdown 渲染、工具调用展示、重新生成和导出 Markdown
 */
export function MessageItem({
  message,
  onRegenerate,
  showActions = true,
  isRegenerating = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;

  /** 处理导出 Markdown */
  const handleExportMarkdown = () => {
    exportToMarkdown({
      content: message.content,
      trimByMarkers: true, // 截取开始/结束标记之间的正式内容
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
              <>
                {/* 工具调用步骤 */}
                {hasToolCalls && (
                  <ToolCallSteps steps={message.toolCalls!} className="mb-3" />
                )}

                {/* 消息内容 */}
                {message.content ? (
                  <MarkdownRenderer content={message.content} />
                ) : message.isStreaming ? (
                  <span className="text-muted-foreground">正在思考...</span>
                ) : null}
              </>
            )}
          </div>

          {/* AI 消息操作按钮 */}
          {!isUser &&
            showActions &&
            !message.isStreaming &&
            message.content && (
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
                  onClick={handleExportMarkdown}
                  className="flex cursor-pointer items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>导出 MD</span>
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
