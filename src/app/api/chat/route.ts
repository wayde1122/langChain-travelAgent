import { NextRequest, NextResponse } from 'next/server';

import { chat } from '@/lib/langchain';

import type {
  ChatApiRequest,
  ChatApiResponse,
  Message,
  ApiMessage,
} from '@/types';

/**
 * 将 API 消息转换为内部消息格式
 */
function convertApiMessages(apiMessages: ApiMessage[]): Message[] {
  return apiMessages.map((msg, index) => ({
    id: `history-${index}`,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(),
  }));
}

/**
 * 验证请求体
 */
function validateRequest(body: unknown): body is ChatApiRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const request = body as Record<string, unknown>;

  if (typeof request.message !== 'string' || !request.message.trim()) {
    return false;
  }

  // 验证 history（如果存在）
  if (request.history !== undefined) {
    if (!Array.isArray(request.history)) {
      return false;
    }

    for (const msg of request.history) {
      if (
        typeof msg !== 'object' ||
        !msg ||
        typeof (msg as ApiMessage).role !== 'string' ||
        typeof (msg as ApiMessage).content !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * POST /api/chat
 * 聊天 API 端点
 *
 * 请求体:
 * {
 *   message: string;      // 用户消息
 *   history?: ApiMessage[]; // 历史消息（可选）
 * }
 *
 * 响应:
 * {
 *   success: boolean;
 *   message?: string;  // AI 回复（成功时）
 *   error?: string;    // 错误信息（失败时）
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatApiResponse>> {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求
    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的请求格式，请提供 message 字段',
        },
        { status: 400 }
      );
    }

    const { message, history = [] } = body;

    // 转换历史消息格式
    const convertedHistory = convertApiMessages(history);

    // 调用 LLM
    const response = await chat({
      input: message.trim(),
      history: convertedHistory,
    });

    // 处理响应
    if (!response.success) {
      return NextResponse.json(
        {
          success: false,
          error: response.error ?? '调用 AI 服务失败',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response.content,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // 区分不同类型的错误
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的 JSON 格式',
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : '服务器内部错误';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
