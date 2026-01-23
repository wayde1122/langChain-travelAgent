import { NextResponse } from 'next/server';

/**
 * POST /api/chat
 * 聊天 API 端点
 */
export async function POST() {
  // TODO: 实现聊天逻辑
  return NextResponse.json({ message: 'Chat API' });
}
