/**
 * Markdown 导出工具
 * 纯 JS 实现，性能极佳
 */

/** 开始标记 - AI 在正式内容开始前插入此标记 */
const START_MARKER = '<!-- START_ITINERARY -->';

/** 结束标记 - AI 在主要内容结束后插入此标记 */
const END_MARKER = '<!-- END_ITINERARY -->';

/** 导出选项 */
export interface ExportMarkdownOptions {
  /** Markdown 内容 */
  content: string;
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 是否截取标记之间的内容（去除开场白和追问） */
  trimByMarkers?: boolean;
}

/**
 * 从内容中提取标题（用于文件名）
 */
function extractTitle(content: string): string {
  // 查找包含地点和天数的文本
  const match = content.match(/(\S+)\s*(\d+)\s*[日天](?:深度)?游/);
  if (match) {
    return `${match[1]}${match[2]}日游行程`;
  }

  // 查找第一个标题
  const headingMatch = content.match(/^#+\s*(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].replace(/[🌟📅#\[\]]/g, '').trim();
  }

  return '旅行行程';
}

/**
 * 处理内容：截取开始标记之后、结束标记之前的部分
 */
function processContent(content: string, trimByMarkers: boolean): string {
  if (!trimByMarkers) {
    return content;
  }

  let result = content;

  // 1. 处理开始标记：截取标记之后的内容
  const startIndex = result.indexOf(START_MARKER);
  if (startIndex > -1) {
    result = result.slice(startIndex + START_MARKER.length);
  } else {
    // 如果没有开始标记，尝试用正则过滤常见的开场白
    const startPatterns = [
      /^[\s\S]*?(?=\n##\s)/, // 跳过第一个二级标题之前的内容
      /^(?:你好|嗨|Hi)[\s\S]*?(?=\n\n)/, // 跳过问候语段落
    ];
    for (const pattern of startPatterns) {
      const match = result.match(pattern);
      if (match && match[0].length < result.length * 0.3) {
        // 只有当开场白不超过 30% 时才去除
        result = result.slice(match[0].length);
        break;
      }
    }
  }

  // 2. 处理结束标记：截取标记之前的内容
  const endIndex = result.indexOf(END_MARKER);
  if (endIndex > -1) {
    result = result.slice(0, endIndex);
  } else {
    // 如果没有结束标记，尝试用正则过滤常见的追问内容
    const endPatterns = [
      /\n+(?:如果你|需要我|还有什么|随时|祝你|旅途愉快|有问题)[\s\S]*$/,
      /\n+---\n+(?:如果|需要|还有|随时|祝)[\s\S]*$/,
    ];
    for (const pattern of endPatterns) {
      result = result.replace(pattern, '');
    }
  }

  return result.trim();
}

/**
 * 导出 Markdown 文件
 *
 * @param options - 导出选项
 *
 * @example
 * ```ts
 * exportToMarkdown({
 *   content: '# 三亚5日游\n\n## Day 1\n...',
 *   trimAfterMarker: true,
 * });
 * ```
 */
export function exportToMarkdown({
  content,
  filename,
  trimByMarkers = true,
}: ExportMarkdownOptions): void {
  // 处理内容：截取标记之间的正式内容
  const processedContent = processContent(content, trimByMarkers);

  // 生成文件名
  const finalFilename = filename ?? extractTitle(content);

  // 创建 Blob
  const blob = new Blob([processedContent], {
    type: 'text/markdown;charset=utf-8',
  });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${finalFilename}.md`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 标记常量（供外部使用）
 */
export const ITINERARY_START_MARKER = START_MARKER;
export const ITINERARY_END_MARKER = END_MARKER;
