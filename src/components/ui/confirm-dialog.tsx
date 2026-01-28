'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';

interface ConfirmDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认回调 */
  onConfirm: () => void;
  /** 是否为危险操作 */
  destructive?: boolean;
}

/**
 * 确认对话框组件
 * 用于删除等需要二次确认的操作
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* 遮罩层 */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* 对话框内容 */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-sm',
            'translate-x-[-50%] translate-y-[-50%]',
            'rounded-xl bg-white p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          <div className="flex flex-col items-center text-center">
            {/* 图标 */}
            <div
              className={cn(
                'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
                destructive ? 'bg-red-100' : 'bg-amber-100'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-6 w-6',
                  destructive ? 'text-red-600' : 'text-amber-600'
                )}
              />
            </div>

            {/* 标题 */}
            <DialogPrimitive.Title className="text-lg font-semibold text-neutral-900">
              {title}
            </DialogPrimitive.Title>

            {/* 描述 */}
            {description && (
              <DialogPrimitive.Description className="mt-2 text-sm text-neutral-500">
                {description}
              </DialogPrimitive.Description>
            )}

            {/* 按钮组 */}
            <div className="mt-6 flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {cancelText}
              </Button>
              <Button
                variant={destructive ? 'destructive' : 'default'}
                className={cn(
                  'flex-1',
                  destructive && 'bg-red-600 hover:bg-red-700'
                )}
                onClick={handleConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
