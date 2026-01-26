'use client';

import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * Markdown 渲染组件
 * 支持 GFM（表格、删除线、任务列表等）和 HTML 标签（如 <br>）
 */
export const MarkdownRenderer = forwardRef<
  HTMLDivElement,
  MarkdownRendererProps
>(function MarkdownRenderer({ content, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn('markdown-content text-sm leading-relaxed', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

/** 自定义 Markdown 组件样式映射 */
const markdownComponents: Components = {
  // 段落
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,

  // 标题
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-xl font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-lg font-bold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>
  ),

  // 列表
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // 行内代码
  code: ({ className, children, ...props }) => {
    // 检查是否是代码块（有 language-xxx 类名）
    const isCodeBlock = className?.startsWith('language-');

    if (isCodeBlock) {
      return (
        <code className={cn('text-sm', className)} {...props}>
          {children}
        </code>
      );
    }

    // 行内代码
    return (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-neutral-800">
        {children}
      </code>
    );
  },

  // 代码块
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-neutral-100 p-4 text-sm">
      {children}
    </pre>
  ),

  // 引用
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-neutral-300 pl-4 italic text-neutral-600">
      {children}
    </blockquote>
  ),

  // 链接
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800"
    >
      {children}
    </a>
  ),

  // 表格
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full border-collapse border border-neutral-200">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-neutral-200">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-200 px-3 py-2">{children}</td>
  ),

  // 水平线
  hr: () => <hr className="my-4 border-neutral-200" />,

  // 强调
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  // 删除线
  del: ({ children }) => (
    <del className="text-neutral-500 line-through">{children}</del>
  ),
};
