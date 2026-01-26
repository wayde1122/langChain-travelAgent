/**
 * 聊天服务
 * 封装所有与聊天相关的 API 调用
 */

import { request, createCancellableRequest } from '@/lib/utils/request';

import type { ApiResponse } from '@/lib/utils/request';
import type { ApiMessage, ChatApiResponse } from '@/types';

/** AI 聊天请求超时时间（毫秒）- 2分钟 */
const CHAT_TIMEOUT = 120000;

/** 聊天服务 */
export const chatService = {
  /**
   * 发送消息
   * @param message - 用户消息内容
   * @param history - 历史消息记录
   * @returns Promise<ApiResponse<ChatApiResponse>>
   */
  sendMessage: async (
    message: string,
    history: ApiMessage[] = []
  ): Promise<ApiResponse<ChatApiResponse>> => {
    return request<ChatApiResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      timeout: CHAT_TIMEOUT,
    });
  },

  /**
   * 创建可取消的发送消息请求
   * 用于需要取消请求的场景（如重新生成时取消上一次请求）
   * @returns [sendMessage 函数, cancel 函数]
   */
  createCancellableSend: () => {
    const [doRequest, cancel] = createCancellableRequest();

    const sendMessage = async (
      message: string,
      history: ApiMessage[] = []
    ): Promise<ApiResponse<ChatApiResponse>> => {
      return doRequest<ChatApiResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
        timeout: CHAT_TIMEOUT,
      });
    };

    return [sendMessage, cancel] as const;
  },
};
