'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  /** 自定义类名 */
  className?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 提示文字 */
  text?: string;
}

/**
 * 加载指示器组件
 * 显示三个跳动的圆点，模拟 AI 思考状态
 */
export function LoadingIndicator({
  className,
  showAvatar = true,
  text = 'AI 正在思考',
}: LoadingIndicatorProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <Image
            src="/travel-icon.jpg"
            alt="AI"
            width={32}
            height={32}
            className="shrink-0 rounded-full"
          />
        )}
        <div className="flex flex-1 items-center gap-2 pt-2">
          {/* 跳动的圆点 */}
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce-dot rounded-full bg-neutral-400" />
            <span className="animation-delay-150 h-2 w-2 animate-bounce-dot rounded-full bg-neutral-400" />
            <span className="animation-delay-300 h-2 w-2 animate-bounce-dot rounded-full bg-neutral-400" />
          </div>
          {/* 提示文字 */}
          <span className="text-sm text-neutral-500">{text}</span>
        </div>
      </div>
    </div>
  );
}
