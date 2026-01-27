/**
 * 知识导入脚本
 * 从 JSONL 文件加载景点数据，切分后向量化存储到 Supabase
 *
 * 使用方法：
 *   npx tsx scripts/ingest-knowledge.ts
 *
 * 选项：
 *   --clear    清空现有知识库后再导入
 *   --dry-run  仅模拟运行，不实际写入数据库
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import {
  loadPOIDocuments,
  splitDocuments,
  addDocuments,
  clearKnowledgeBase,
  isKnowledgeBaseEmpty,
  getKnowledgeStats,
  estimateChunkCount,
} from '../src/lib/langchain/rag';

/**
 * 解析命令行参数
 */
function parseArgs(): { clear: boolean; dryRun: boolean } {
  const args = process.argv.slice(2);
  return {
    clear: args.includes('--clear'),
    dryRun: args.includes('--dry-run'),
  };
}

/**
 * 格式化进度条
 */
function formatProgress(current: number, total: number): string {
  const percent = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  return `[${bar}] ${percent}% (${current}/${total})`;
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  const { clear, dryRun } = parseArgs();

  console.log('');
  console.log('🚀 知识库导入脚本');
  console.log('================');
  console.log(
    `   模式: ${dryRun ? '🔍 模拟运行 (不写入数据库)' : '💾 正式导入'}`
  );
  console.log(`   清空: ${clear ? '✅ 是' : '❌ 否'}`);
  console.log('');

  // 检查环境变量
  const requiredEnvVars = dryRun
    ? ['DASHSCOPE_API_KEY'] // dry-run 只需要 embedding 模型
    : [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DASHSCOPE_API_KEY',
      ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.error('❌ 缺少环境变量:', missingVars.join(', '));
    console.error('   请在 .env.local 中配置这些变量');
    if (!dryRun) {
      console.error(
        '   SUPABASE_SERVICE_ROLE_KEY 可在 Supabase Dashboard > Project Settings > API 获取'
      );
    }
    process.exit(1);
  }

  try {
    // Step 1: 检查现有知识库（仅非 dry-run 模式）
    if (!dryRun) {
      console.log('📊 检查现有知识库...');
      const isEmpty = await isKnowledgeBaseEmpty();

      if (!isEmpty) {
        if (clear) {
          console.log('🗑️ 清空现有知识库...');
          await clearKnowledgeBase();
        } else {
          const stats = await getKnowledgeStats();
          console.log(`⚠️ 知识库已有 ${stats.totalDocuments} 条文档`);
          console.log('   使用 --clear 选项可以清空后重新导入');
          console.log('   继续导入将追加到现有数据...');
          console.log('');
        }
      }
    }

    // Step 2: 加载文档
    console.log('📚 加载 JSONL 文档...');
    const docs = await loadPOIDocuments();

    if (docs.length === 0) {
      console.error('❌ 未加载到任何文档');
      process.exit(1);
    }

    // Step 3: 切分文档
    console.log('');
    console.log('✂️ 切分文档...');
    const chunks = await splitDocuments(docs);

    // 估算信息
    const estimatedChunks = estimateChunkCount(docs);
    console.log(`   预估块数: ${estimatedChunks}`);
    console.log(`   实际块数: ${chunks.length}`);

    if (dryRun) {
      console.log('');
      console.log('🔍 模拟运行完成');
      console.log('================');
      console.log(`   文档数: ${docs.length}`);
      console.log(`   块数: ${chunks.length}`);
      console.log(
        `   预计 Embedding API 调用: ${Math.ceil(chunks.length / 50)} 批次`
      );
      console.log('');
      console.log('使用不带 --dry-run 选项运行以实际导入');
      return;
    }

    // Step 4: 向量化并存储
    console.log('');
    console.log('🔄 向量化并存储...');

    const result = await addDocuments(chunks, (current, total) => {
      process.stdout.write(`\r   ${formatProgress(current, total)}`);
    });

    console.log(''); // 换行

    // Step 5: 输出统计
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('✅ 导入完成');
    console.log('================');
    console.log(`   成功: ${result.success} 条`);
    console.log(`   失败: ${result.failed} 条`);
    console.log(`   耗时: ${duration} 秒`);

    // 获取最终统计
    const finalStats = await getKnowledgeStats();
    console.log('');
    console.log('📊 知识库统计');
    console.log('================');
    console.log(`   总文档数: ${finalStats.totalDocuments}`);
    console.log(`   城市数: ${finalStats.totalCities}`);
    console.log(
      `   城市列表: ${finalStats.cities.slice(0, 10).join('、')}${finalStats.cities.length > 10 ? '...' : ''}`
    );
  } catch (error) {
    console.error('');
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

// 运行
main();
