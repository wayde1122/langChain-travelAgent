'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Wrench,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ToolCallStep } from '@/types';

interface ToolCallStepsProps {
  steps: ToolCallStep[];
  className?: string;
}

/**
 * 工具调用步骤展示组件
 */
export function ToolCallSteps({ steps, className }: ToolCallStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) {
    return null;
  }

  const completedCount = steps.filter(
    (s) => s.status === 'success' || s.status === 'error'
  ).length;
  const hasRunning = steps.some((s) => s.status === 'running');

  return (
    <div
      className={cn(
        'mb-3 rounded-lg border border-border/50 bg-muted/30',
        className
      )}
    >
      {/* 标题栏 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Wrench className="h-4 w-4" />
        <span>
          工具调用
          {hasRunning ? (
            <span className="ml-1 text-primary">（进行中...）</span>
          ) : (
            <span className="ml-1">
              （{completedCount}/{steps.length} 完成）
            </span>
          )}
        </span>
      </button>

      {/* 步骤列表 */}
      {isExpanded && (
        <div className="border-t border-border/50 px-3 py-2 space-y-2">
          {steps.map((step) => (
            <ToolCallStepItem key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolCallStepItemProps {
  step: ToolCallStep;
}

/**
 * 单个工具调用步骤
 */
function ToolCallStepItem({ step }: ToolCallStepItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        {/* 状态图标 */}
        {step.status === 'running' && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {step.status === 'success' && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        {step.status === 'pending' && (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
        )}

        {/* 工具名称 */}
        <span className="font-medium">{step.displayName}</span>

        {/* 结果摘要 */}
        {step.output && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? '收起' : '详情'}
          </button>
        )}
      </div>

      {/* 详细信息 */}
      {showDetails && step.output && (
        <div className="mt-1 ml-6 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
          <pre className="whitespace-pre-wrap break-words">{step.output}</pre>
        </div>
      )}

      {/* 错误信息 */}
      {step.error && (
        <div className="mt-1 ml-6 text-xs text-red-500">{step.error}</div>
      )}
    </div>
  );
}

export default ToolCallSteps;
