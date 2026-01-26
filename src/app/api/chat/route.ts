import { NextRequest, NextResponse } from 'next/server';

import {
  chat,
  chatStream,
  executeAgentStream,
  executeAgent,
} from '@/lib/langchain';

import type {
  ChatApiRequest,
  ChatApiResponse,
  Message,
  ApiMessage,
  AgentEvent,
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
function validateRequest(
  body: unknown
): body is ChatApiRequest & { useAgent?: boolean } {
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
 * 聊天 API 端点（支持流式和非流式，支持 Agent 模式）
 *
 * 请求体:
 * {
 *   message: string;        // 用户消息
 *   history?: ApiMessage[]; // 历史消息（可选）
 *   stream?: boolean;       // 是否启用流式输出（默认 true）
 *   useAgent?: boolean;     // 是否使用 Agent 模式（默认 true）
 * }
 *
 * Agent 流式响应 (SSE):
 * - data: {"type": "thinking", "content": "..."}
 * - data: {"type": "tool_start", "id": "...", "name": "...", "displayName": "...", "input": {...}}
 * - data: {"type": "tool_end", "id": "...", "name": "...", "output": "..."}
 * - data: {"type": "content", "content": "..."}
 * - data: {"type": "error", "message": "..."}
 * - data: {"done": true}
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

    const { message, history = [], stream = true, useAgent = true } = body;

    // 转换历史消息格式
    const convertedHistory = convertApiMessages(history);

    // Agent 模式
    if (useAgent) {
      if (stream) {
        return handleAgentStreamResponse(message.trim(), convertedHistory);
      } else {
        return handleAgentResponse(message.trim(), convertedHistory);
      }
    }

    // 传统模式（向后兼容）
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
 * 处理 Agent 流式响应
 */
async function handleAgentStreamResponse(
  message: string,
  history: Message[]
): Promise<Response> {
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

      // 发送 Agent 事件
      const sendEvent = (event: AgentEvent) => {
        const data = JSON.stringify(event);
        safeEnqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        const agentStream = executeAgentStream({
          input: message,
          history,
        });

        for await (const event of agentStream) {
          sendEvent(event);
        }
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
          console.error('Agent stream error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Agent 执行错误';
          sendEvent({ type: 'error', message: errorMessage });
          sendEvent({ done: true });
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

/**
 * 处理 Agent 非流式响应
 */
async function handleAgentResponse(
  message: string,
  history: Message[]
): Promise<NextResponse<ChatApiResponse>> {
  const result = await executeAgent({
    input: message,
    history,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error ?? 'Agent 执行失败',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: result.content,
  });
}

/**
 * 处理传统流式响应（向后兼容）
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
          // 发送内容块（转换为 Agent 格式以保持前端兼容）
          const data = JSON.stringify({ type: 'content', content: chunk });
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
              `data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`
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

/**
 * 导出运行时配置
 * 使用 Node.js 运行时以支持 MCP 子进程
 */
export const runtime = 'nodejs';
