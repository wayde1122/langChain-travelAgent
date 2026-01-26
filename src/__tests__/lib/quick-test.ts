/**
 * 快速测试 LLM 调用
 */
import { chat } from '../../lib/langchain/chain';

async function main() {
  console.log('测试中...');
  const res = await chat({ input: '你好，介绍一下北京' });
  console.log('结果:', res);
}

main();
