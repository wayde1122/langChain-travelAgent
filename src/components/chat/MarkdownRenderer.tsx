'use client';

import React, { forwardRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

import type { Components } from 'react-markdown';

/** 结尾标记 - 此标记之后的建议才可点击 */
const END_ITINERARY_MARKER = '<!-- END_ITINERARY -->';

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义类名 */
  className?: string;
  /** 建议点击回调（填入输入框，仅用于末尾建议） */
  onSuggestionClick?: (suggestion: string) => void;
}

/**
 * Markdown 渲染组件
 * 支持 GFM（表格、删除线、任务列表等）和 HTML 标签（如 <br>）
 *
 * 建议处理逻辑：
 * - `<!-- END_ITINERARY -->` 标记之前：建议只展示为普通样式，不可点击
 * - `<!-- END_ITINERARY -->` 标记之后：建议渲染为可点击按钮，点击后填入输入框
 */
export const MarkdownRenderer = forwardRef<
  HTMLDivElement,
  MarkdownRendererProps
>(function MarkdownRenderer({ content, className, onSuggestionClick }, ref) {
  // 分割内容：正式内容 + 末尾建议
  const { mainContent, tailContent } = useMemo(() => {
    const markerIndex = content.indexOf(END_ITINERARY_MARKER);
    if (markerIndex === -1) {
      // 没有标记，全部作为正式内容（建议不可点击）
      return { mainContent: content, tailContent: null };
    }
    // 分割：标记之前为正式内容，标记之后为末尾建议
    return {
      mainContent: content.slice(0, markerIndex),
      tailContent: content.slice(markerIndex + END_ITINERARY_MARKER.length),
    };
  }, [content]);

  // 正式内容的组件（建议不可点击）
  const mainComponents = useMemo(() => createMarkdownComponents(undefined), []);

  // 末尾建议的组件（建议可点击）
  const tailComponents = useMemo(
    () => createMarkdownComponents(onSuggestionClick),
    [onSuggestionClick]
  );

  return (
    <div
      ref={ref}
      className={cn('markdown-content text-sm leading-relaxed', className)}
    >
      {/* 正式内容：建议只展示，不可点击 */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={mainComponents}
      >
        {mainContent}
      </ReactMarkdown>

      {/* 末尾建议：可点击，填入输入框 */}
      {tailContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={tailComponents}
        >
          {tailContent}
        </ReactMarkdown>
      )}
    </div>
  );
});

/** suggest: 链接前缀 */
const SUGGEST_PREFIX = 'suggest:';

/**
 * 常见 emoji 范围（用于检测建议链接）
 * 包括：表情符号、符号、图标等
 */
const EMOJI_RANGES = [
  [0x1f300, 0x1f9ff], // 杂项符号和象形文字
  [0x2600, 0x26ff], // 杂项符号
  [0x2700, 0x27bf], // 装饰符号
  [0x1f600, 0x1f64f], // 表情符号
  [0x1f680, 0x1f6ff], // 交通和地图符号
  [0x1f1e0, 0x1f1ff], // 旗帜
];

/**
 * 检查字符是否是 emoji
 */
function isEmoji(char: string): boolean {
  if (!char) return false;
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  for (const [start, end] of EMOJI_RANGES) {
    if (codePoint >= start && codePoint <= end) {
      return true;
    }
  }
  return false;
}

/**
 * 检查是否是外部链接（HTTP/HTTPS URL）
 */
function isExternalUrl(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith('http://') || href.startsWith('https://');
}

/**
 * 检查是否是建议链接
 * 逻辑：非外部链接都当作建议（包括 suggest:、#、空、或其他格式）
 */
function isSuggestionLink(
  href: string | undefined,
  children: React.ReactNode
): boolean {
  // 明确的 suggest: 前缀
  if (href?.startsWith(SUGGEST_PREFIX)) return true;

  // 如果是外部 URL，检查文本是否以 emoji 开头
  if (isExternalUrl(href)) {
    const text = extractTextFromChildren(children);
    if (text) {
      const firstChar = [...text][0];
      if (isEmoji(firstChar)) {
        return true;
      }
    }
    // 外部 URL 且无 emoji，当作普通链接
    return false;
  }

  // 非外部 URL（#、空、suggest: 或其他），都当作建议
  return true;
}

/**
 * 从 children 中提取文本内容
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractTextFromChildren(props.children);
  }
  return '';
}

/**
 * 去除文本开头的 emoji 和空白
 */
function removeLeadingEmoji(text: string): string {
  const chars = [...text];
  let startIndex = 0;

  // 跳过开头的 emoji 和空白字符
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (isEmoji(char) || char === ' ' || char === '\t') {
      startIndex = i + 1;
    } else {
      break;
    }
  }

  return text.slice(startIndex).trim();
}

/**
 * 获取建议内容（去除 emoji）
 */
function getSuggestionContent(
  href: string | undefined,
  children: React.ReactNode
): string {
  // 如果 href 是 suggest: 格式，直接使用 suggest: 后的内容
  if (href?.startsWith(SUGGEST_PREFIX)) {
    return decodeURIComponent(href.slice(SUGGEST_PREFIX.length));
  }

  // 否则使用链接文本，但去除开头的 emoji
  const text = extractTextFromChildren(children);
  return removeLeadingEmoji(text);
}

/**
 * 创建自定义 Markdown 组件样式映射
 * @param onSuggestionClick - 建议点击回调
 */
function createMarkdownComponents(
  onSuggestionClick?: (suggestion: string) => void
): Components {
  return {
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
      <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">
        {children}
      </h3>
    ),

    // 列表
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    // 列表项 - 普通渲染，建议由链接组件处理
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

    // 链接 - 支持建议链接和普通链接
    a: ({ href, children }) => {
      // 检查是否是建议链接
      if (isSuggestionLink(href, children)) {
        // 如果有 onSuggestionClick 回调，渲染为可点击按钮（末尾建议）
        if (onSuggestionClick) {
          const suggestion = getSuggestionContent(href, children);
          return (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSuggestionClick(suggestion);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSuggestionClick(suggestion);
                }
              }}
              className="inline-block px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50 cursor-pointer"
            >
              {children}
            </span>
          );
        }

        // 没有回调时，直接输出为普通文本（中间建议）
        return <>{children}</>;
      }

      // 普通链接
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {children}
        </a>
      );
    },

    // 表格
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto">
        <table className="min-w-full border-collapse border border-neutral-200">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-neutral-50">{children}</thead>
    ),
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
}
