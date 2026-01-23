'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className="mb-6">
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
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
