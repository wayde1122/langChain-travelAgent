/**
 * PDF 导出工具
 * 使用浏览器原生打印功能实现 PDF 导出
 */

/** 导出选项 */
export interface ExportPdfOptions {
  /** PDF 标题 */
  title?: string;
  /** HTML 内容 */
  content: string;
  /** 自定义样式 */
  styles?: string;
  /** 是否提取行程内容（过滤开场白和结尾互动） */
  extractItinerary?: boolean;
}

/** 默认打印样式 */
const DEFAULT_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
  }
  
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
  h3 { font-size: 1.125rem; }
  
  p {
    margin-bottom: 1em;
  }
  
  ul, ol {
    margin-bottom: 1em;
    padding-left: 1.5em;
  }
  
  li {
    margin-bottom: 0.25em;
  }
  
  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "SF Mono", Monaco, Consolas, monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1em 0;
  }
  
  pre code {
    background: none;
    padding: 0;
  }
  
  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin: 1em 0;
    color: #666;
    font-style: italic;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
  }
  
  a {
    color: #2563eb;
    text-decoration: underline;
  }
  
  hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 1.5em 0;
  }
  
  img {
    max-width: 100%;
    height: auto;
  }
  
  .header {
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .header h1 {
    margin: 0;
    font-size: 1.25rem;
    color: #666;
  }
  
  .header .date {
    font-size: 0.875rem;
    color: #999;
    margin-top: 0.5rem;
  }
  
  @media print {
    body {
      padding: 0;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
`;

/**
 * 从 HTML 内容中提取行程相关部分
 * 过滤掉开场白和结尾的互动内容
 */
function extractItineraryContent(html: string): string {
  // 创建临时 DOM 解析 HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;

  if (!container) return html;

  const children = Array.from(container.children);

  // 查找行程开始位置
  let startIndex = -1;
  let endIndex = children.length;

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const text = el.textContent ?? '';
    const tagName = el.tagName;

    // 查找行程开始：
    // 1. 包含 "行程总览" 的标题/内容
    // 2. 包含 "Day 1" 或 "📅" 的内容
    // 3. 第一个 HR 之后的内容
    if (startIndex === -1) {
      // 优先匹配行程总览或 Day 标题
      if (/行程总览|【行程总览】/.test(text)) {
        startIndex = i;
      } else if (/Day\s*\d|📅\s*Day/.test(text)) {
        startIndex = i;
      } else if (tagName === 'HR') {
        // HR 之后才是正式内容，跳过 HR 本身
        startIndex = i + 1;
      }
    }

    // 查找行程结束：包含互动性质的内容
    if (startIndex !== -1 && startIndex <= i) {
      if (/如果你告诉我|祝你在|需要我帮你|随时喊我|旅途愉快/.test(text)) {
        endIndex = i;
        break;
      }
    }
  }

  // 如果没找到明确的开始位置，跳过开头的段落（开场白）
  if (startIndex === -1 || startIndex >= children.length) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const tagName = el.tagName;
      // 跳过段落，找到第一个非段落元素（通常是标题或列表）
      if (tagName !== 'P') {
        startIndex = i;
        break;
      }
    }
  }

  // 如果还是没找到有效的开始位置，返回原始内容
  if (startIndex === -1 || startIndex >= children.length) return html;

  // 提取行程部分
  const itineraryElements = children.slice(startIndex, endIndex);
  return itineraryElements.map((el) => el.outerHTML).join('\n');
}

/**
 * 从内容中提取标题（用于 PDF 标题）
 */
function extractTitle(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');

  // 查找包含地点和天数的文本
  const text = doc.body.textContent ?? '';
  const match = text.match(/(\S+)\s*(\d+)\s*[日天](?:深度)?游/);
  if (match) {
    return `${match[1]}${match[2]}日游行程`;
  }

  // 查找第一个 h2 或 h3 标题
  const heading = doc.querySelector('h2, h3');
  if (heading?.textContent) {
    return heading.textContent.replace(/[🌟📅#\[\]]/g, '').trim();
  }

  return null;
}

/**
 * 导出内容为 PDF
 * 通过创建隐藏的 iframe 并调用浏览器打印功能实现
 *
 * @param options - 导出选项
 *
 * @example
 * ```ts
 * exportToPdf({
 *   title: 'AI 回复',
 *   content: '<p>这是 AI 的回复内容...</p>',
 *   extractItinerary: true, // 只导出行程相关内容
 * });
 * ```
 */
export function exportToPdf({
  title,
  content,
  styles = DEFAULT_STYLES,
  extractItinerary = true,
}: ExportPdfOptions): void {
  // 处理内容：提取行程部分
  const processedContent = extractItinerary
    ? extractItineraryContent(content)
    : content;

  // 自动提取标题
  const finalTitle = title ?? extractTitle(content) ?? '旅行行程';

  // 创建隐藏的 iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    console.error('无法创建打印文档');
    return;
  }

  // 写入内容（直接输出行程，不添加额外标题）
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${finalTitle}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${processedContent}
      </body>
    </html>
  `);
  doc.close();

  // 使用标志确保只触发一次打印
  let hasPrinted = false;

  const triggerPrint = () => {
    if (hasPrinted || !document.body.contains(iframe)) return;
    hasPrinted = true;

    iframe.contentWindow?.print();

    // 打印完成后清理
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  // 等待内容加载完成后触发打印
  iframe.onload = () => {
    setTimeout(triggerPrint, 250);
  };

  // 如果 onload 不触发，手动触发打印（备用）
  setTimeout(triggerPrint, 500);
}
