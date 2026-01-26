import { NextRequest, NextResponse } from 'next/server';

import { chat, chatStream } from '@/lib/langchain';

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
 * 聊天 API 端点（支持流式和非流式）
 *
 * 请求体:
 * {
 *   message: string;        // 用户消息
 *   history?: ApiMessage[]; // 历史消息（可选）
 *   stream?: boolean;       // 是否启用流式输出（默认 false）
 * }
 *
 * 非流式响应:
 * {
 *   success: boolean;
 *   message?: string;  // AI 回复（成功时）
 *   error?: string;    // 错误信息（失败时）
 * }
 *
 * 流式响应:
 * Server-Sent Events (SSE) 格式
 * - data: {"content": "..."} // 内容块
 * - data: {"done": true}     // 完成标记
 * - data: {"error": "..."}   // 错误信息
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatApiResponse> | Response> {
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

    const { message, history = [], stream = false } = body;

    // 转换历史消息格式
    const convertedHistory = convertApiMessages(history);

    // 流式响应
    if (stream) {
      return handleStreamResponse(message.trim(), convertedHistory);
    }

    // 非流式响应
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

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  message: string,
  history: Message[]
): Promise<Response> {
  const response = await chatStream({
    input: message,
    history,
  });

  // 处理错误
  if (!response.success) {
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: response.error })}\n\n`
          )
        );
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // 创建 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;

      // 安全写入函数
      const safeEnqueue = (data: Uint8Array) => {
        if (!isClosed) {
          try {
            controller.enqueue(data);
          } catch {
            isClosed = true;
          }
        }
      };

      // 安全关闭函数
      const safeClose = () => {
        if (!isClosed) {
          try {
            controller.close();
            isClosed = true;
          } catch {
            // 已关闭，忽略
          }
        }
      };

      try {
        for await (const chunk of response.stream) {
          // 发送内容块
          const data = JSON.stringify({ content: chunk });
          safeEnqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // 发送完成标记
        safeEnqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (error) {
        // 忽略取消请求导致的错误
        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('aborted') ||
            error.message.includes('cancelled'))
        ) {
          // 请求被取消，正常关闭
        } else {
          console.error('Stream error:', error);
          const errorMessage =
            error instanceof Error ? error.message : '流式传输错误';
          safeEnqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
        }
      } finally {
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
