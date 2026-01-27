/**
 * 检查知识库状态脚本
 * 使用方法：npx tsx scripts/check-knowledge.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getKnowledgeStats, loadPOIDocuments } from '../src/lib/langchain/rag';

async function main() {
  console.log('📊 知识库状态检查\n');

  // 检查 JSONL 源数据
  console.log('源数据:');
  const docs = await loadPOIDocuments();
  console.log(`   - JSONL 文档数: ${docs.length}`);

  // 检查数据库
  console.log('\n数据库:');
  try {
    const stats = await getKnowledgeStats();
    console.log(`   - 已导入文档数: ${stats.totalDocuments}`);
    console.log(`   - 城市数: ${stats.totalCities}`);
    console.log(`   - 城市列表: ${stats.cities.join('、')}`);
  } catch (error) {
    console.log(
      `   - 查询失败: ${error instanceof Error ? error.message : error}`
    );
  }
}

main();
