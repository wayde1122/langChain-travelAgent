/**
 * LLM 对话测试
 * 运行: npx tsx src/__tests__/lib/test-chat.ts
 */
import * as readline from 'readline';

import { chat } from '../../lib/langchain/chain';

import type { Message } from '../../types';

const history: Message[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n🌍 旅行助手测试 (输入 exit 退出)\n');

function ask(): void {
  rl.question('你: ', async (input) => {
    if (input.trim() === 'exit') {
      rl.close();
      return;
    }

    if (!input.trim()) {
      ask();
      return;
    }

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };
    history.push(userMsg);

    const res = await chat({
      input: input.trim(),
      history: history.slice(0, -1),
    });

    if (res.success) {
      history.push({
        id: String(Date.now()),
        role: 'assistant',
        content: res.content,
        createdAt: new Date(),
      });
      console.log(`\n旅伴: ${res.content}\n`);
    } else {
      console.log(`\n错误: ${res.error}\n`);
      history.pop();
    }

    ask();
  });
}

ask();
