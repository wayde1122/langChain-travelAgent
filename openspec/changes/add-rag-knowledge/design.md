# RAG 知识增强 - 技术设计

## Context

旅行助手需要具备回答特定旅行知识问题的能力。RAG 技术通过在生成前检索相关知识，可以显著提高回答的准确性和专业性。

### 约束条件

- 已使用 Supabase PostgreSQL 作为数据库
- 已使用阿里云 DashScope 作为 LLM 提供商
- 数据来源：携程爬虫数据（已预处理为 JSONL 格式）
- 知识库规模：**701 条景点数据**

### 数据源结构（已完成预处理）

```
src/data/knowledge/
└── knowledge.jsonl      # 701 条景点数据（每行一个 JSON）
```

**JSONL 字段结构**：

```json
{
  "name": "亚龙湾国家旅游度假区", // 景点名称（必填）
  "city": "三亚", // 所在城市（必填）
  "intro": "亚龙湾国家旅游度假区...", // 景点介绍（必填）
  "tags": ["夜游观景", "海滨沙滩"], // 标签数组
  "rating": 4.7, // 评分
  "reviewCount": 4332, // 评论数量
  "playTime": "1-3天", // 建议游玩时长
  "openTime": "全年全天开放", // 开放时间
  "topComments": [
    // 筛选后的热门评论（点赞>=5，>=50字，最多10条）
    "三亚旅游必看最全交通指南...",
    "来三亚好多次了..."
  ]
}
```

## Goals / Non-Goals

### Goals

- 支持 JSONL 格式的景点知识数据导入
- 将景点介绍 + 热门评论合并为完整知识文档
- 实现高质量的文档切分，保持语义完整性
- 快速检索相关知识（<500ms）
- 无缝集成到现有 Agent 对话流程

### Non-Goals

- 不支持实时网页抓取（后续扩展）
- 不支持多模态文档（图片 OCR 等）
- 不实现用户自定义知识库（暂时只有全局知识库）

## Decisions

### 1. 向量数据库：Supabase pgvector

**选择理由**：

- 已有 Supabase 基础设施，无需额外部署
- pgvector 扩展成熟稳定
- 支持 HNSW 索引，查询性能优秀
- 与 RLS 策略兼容（未来可扩展用户私有知识库）

**替代方案**：

- Pinecone：托管服务，但需要额外付费和网络延迟
- Chroma：轻量级，但不支持持久化和多实例

### 2. Embedding 模型：text-embedding-v3

**选择理由**：

- 阿里云 DashScope 提供，与现有 LLM 提供商一致
- 1024 维向量，精度和性能平衡
- 支持中文语义理解

**替代方案**：

- OpenAI text-embedding-ada-002：需要额外 API Key
- 本地 BGE 模型：需要 GPU 资源

### 3. 知识构建策略：JSONL 直接加载

**构建流程**：

1. 读取 `src/data/knowledge/knowledge.jsonl`
2. 逐行解析 JSON 对象
3. 合并 `intro` + `topComments` 为完整文档内容
4. 保留 `name`、`city`、`tags` 等作为 metadata

**文档内容模板**（用于向量化）：

```
# {name}（{city}）

## 基本信息
- 标签：{tags.join(", ")}
- 评分：{rating} 分（{reviewCount} 条评论）
- 建议游玩时长：{playTime}
- 开放时间：{openTime}

## 景点介绍
{intro}

## 游客评价
{topComments[0]}
---
{topComments[1]}
...
```

**Metadata 结构**：

```json
{
  "name": "亚龙湾国家旅游度假区",
  "city": "三亚",
  "tags": ["夜游观景", "海滨沙滩"],
  "rating": 4.7,
  "source": "knowledge.jsonl"
}
```

### 4. 文档切分策略：RecursiveCharacterTextSplitter

**参数配置**：

- `chunkSize`: 1000 字符（中文约 500-700 字）
- `chunkOverlap`: 200 字符（保持上下文连贯）
- `separators`: ["\n\n", "\n", "---", "。", "！", "？", " "]

### 5. 评论筛选规则（已在数据预处理时完成）

- **点赞阈值**：点赞数 >= 5
- **最大评论数**：每个景点最多取 10 条热门评论
- **内容长度**：评论内容 >= 50 字符（过滤低质量短评）
- **状态**：✅ 已完成，数据存储在 `topComments` 字段

### 6. 检索策略：相似度搜索

**流程**：

1. 用户问题 → Embedding 向量
2. pgvector 相似度搜索 → Top-K 候选（K=5）
3. 相似度阈值过滤（>= 0.7）
4. 注入 Agent 上下文

## Architecture

```
                                  ┌─────────────────────────────────────┐
                                  │         知识库管理脚本              │
                                  │  scripts/ingest-knowledge.ts       │
                                  └─────────────────────────────────────┘
                                              │
                                              │ 1. 加载文档
                                              ▼
┌─────────────────┐              ┌─────────────────────────────────────┐
│  src/data/      │──────────────│     JSONLDocumentLoader             │
│  knowledge/     │              │  src/lib/langchain/rag/loader.ts   │
│  knowledge.jsonl│              └─────────────────────────────────────┘
│  (701 条景点)   │                           │
└─────────────────┘                           │ 2. 切分
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     TextSplitter                    │
                                 │  src/lib/langchain/rag/splitter.ts │
                                 └─────────────────────────────────────┘
                                              │
                                              │ 3. 向量化
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     Embeddings                      │
                                 │  src/lib/langchain/rag/embeddings.ts│
                                 └─────────────────────────────────────┘
                                              │
                                              │ 4. 存储
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     Supabase pgvector               │
                                 │  documents 表                        │
                                 └─────────────────────────────────────┘


=== 查询流程 ===

┌─────────────────┐              ┌─────────────────────────────────────┐
│  用户提问       │──────────────│     Retriever                       │
│  "北京有什么    │              │  src/lib/langchain/rag/retriever.ts│
│   好吃的？"    │              └─────────────────────────────────────┘
└─────────────────┘                           │
                                              │ 1. 问题向量化
                                              │ 2. 相似度搜索
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     检索结果（Top-K）               │
                                 │  "北京美食：烤鸭、炸酱面..."        │
                                 └─────────────────────────────────────┘
                                              │
                                              │ 3. 注入上下文
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     Agent with RAG Context          │
                                 │  src/lib/langchain/agent.ts        │
                                 └─────────────────────────────────────┘
                                              │
                                              │ 4. 生成回答
                                              ▼
                                 ┌─────────────────────────────────────┐
                                 │     AI 回复                         │
                                 │  "北京美食推荐：1. 全聚德烤鸭..."   │
                                 └─────────────────────────────────────┘
```

## Database Schema

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识文档表
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,           -- 文档片段内容
  metadata JSONB DEFAULT '{}',     -- 元数据（来源、类别、标签等）
  embedding VECTOR(1024),          -- 向量嵌入（text-embedding-v3）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 HNSW 索引（提升查询性能）
CREATE INDEX ON knowledge_documents
USING hnsw (embedding vector_cosine_ops);

-- 创建元数据索引
CREATE INDEX ON knowledge_documents
USING gin (metadata);
```

## File Structure

```
src/lib/langchain/rag/
├── index.ts           # 统一导出
├── embeddings.ts      # Embedding 模型配置
├── loader.ts          # JSONL 文档加载器
├── splitter.ts        # 文档切分器
├── store.ts           # 向量存储（Supabase pgvector）
└── retriever.ts       # 检索器

src/data/knowledge/    # 本地知识文档
└── knowledge.jsonl    # ✅ 已有 701 条景点数据

scripts/
└── ingest-knowledge.ts  # 知识导入脚本

supabase/migrations/
└── 002_create_knowledge_documents.sql
```

## Prompt Template with RAG

```typescript
const RAG_AGENT_PROMPT = `你是一位专业的旅行助手...

## 参考知识
以下是与用户问题相关的旅行知识，请优先参考这些信息回答：

{context}

---

## 注意事项
- 优先使用上述参考知识回答问题
- 如果参考知识不足以回答，可以结合你的通用知识
- 明确标注信息来源，如"根据我们的旅行攻略..."
- 如果信息可能过时，提醒用户出行前确认
`;
```

## Risks / Trade-offs

### 风险 1：Embedding 成本

- **风险**：大量文档向量化可能产生 API 调用成本
- **缓解**：批量处理，增量更新，缓存已处理文档

### 风险 2：检索质量

- **风险**：相似度搜索可能返回不相关结果
- **缓解**：设置相似度阈值，添加重排序，调优 chunk 大小

### 风险 3：上下文过长

- **风险**：注入过多知识可能超过模型上下文限制
- **缓解**：限制 Top-K 数量，压缩/摘要检索结果

## Migration Plan

1. **Phase 1 - 基础设施**
   - 创建数据库迁移
   - 配置 Embedding 模型
   - 实现向量存储

2. **Phase 2 - 文档处理**
   - 实现文档加载器
   - 实现文档切分器
   - 创建导入脚本

3. **Phase 3 - 集成**
   - 实现检索器
   - 集成到 Agent
   - 更新提示词

4. **Phase 4 - 测试**
   - 导入测试数据
   - 验证检索效果
   - 调优参数

## Open Questions

1. ~~知识文档的具体格式是什么？~~ ✅ 已确定：JSONL 格式，701 条景点数据
2. 是否需要支持知识分类/过滤？（可按 `city` 或 `tags` 筛选）
3. 是否需要记录检索日志用于分析？
