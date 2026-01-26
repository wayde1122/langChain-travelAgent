/**
 * 当前日期工具
 * 让 LLM 知道当前时间
 */
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 工具显示名称映射
 */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_current_date: '获取当前日期',
};

/**
 * 获取当前日期工具
 * 返回格式化的日期字符串，包含年、月、日、星期
 */
export const currentDateTool = tool(
  async () => {
    const now = new Date();

    // 使用 Intl API 格式化日期
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'Asia/Shanghai',
    });

    const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });

    const formattedDate = dateFormatter.format(now);
    const formattedTime = timeFormatter.format(now);

    return `当前是 ${formattedDate}，北京时间 ${formattedTime}`;
  },
  {
    name: 'get_current_date',
    description:
      '获取当前日期和时间。当用户询问今天日期、现在时间、或需要知道当前时间来回答问题时使用此工具。',
    schema: z.object({}),
  }
);

/**
 * 所有本地工具
 */
export const localTools = [currentDateTool];
