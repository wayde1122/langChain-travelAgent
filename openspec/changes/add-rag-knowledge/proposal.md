# Change: 添加 RAG 知识增强功能

## Why

当前旅行助手仅依赖 LLM 的通用知识，无法回答特定的旅行知识问题（如景点详细介绍、本地美食推荐、旅行攻略等）。通过 RAG（Retrieval-Augmented Generation）技术，可以让助手基于本地知识库进行回答，提供更准确、更专业的旅行建议。

## What Changes

- **ADDED** 文档加载和解析模块：支持 Markdown、JSON、TXT 等格式的旅行知识文档
- **ADDED** 文档切分（Chunking）功能：将长文档智能切分为语义完整的片段
- **ADDED** 向量存储：使用 Supabase pgvector 存储文档向量
- **ADDED** 检索器（Retriever）：根据用户问题检索相关知识
- **MODIFIED** Agent 提示词：注入检索到的知识上下文
- **ADDED** 知识库管理脚本：支持批量导入和更新文档

## Impact

- Affected specs: `chat-api`（新增 RAG 上下文注入）
- Affected code:
  - `src/lib/langchain/rag/` - 新增 RAG 模块
  - `src/lib/langchain/agent.ts` - 集成 RAG 检索
  - `src/lib/langchain/prompts.ts` - 更新提示词模板
  - `supabase/migrations/` - 新增向量表
  - `scripts/` - 知识库管理脚本
  - `src/data/` - 本地知识文档存放目录
