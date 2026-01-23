'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '输入你的旅行问题...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 focus-within:border-neutral-300 focus-within:bg-white">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-neutral-400',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />

          <Button
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0 rounded-xl',
              input.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-neutral-200 text-neutral-400'
            )}
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Travel Assistant 可能会出错，请核实重要信息
        </p>
      </div>
    </div>
  );
}
