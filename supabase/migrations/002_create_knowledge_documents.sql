-- 002_create_knowledge_documents.sql
-- RAG 知识库文档表

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,           -- 文档片段内容
  metadata JSONB DEFAULT '{}',     -- 元数据（来源、类别、标签等）
  embedding VECTOR(1024),          -- 向量嵌入（text-embedding-v3, 1024维）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 HNSW 索引（提升向量相似度查询性能）
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx 
ON knowledge_documents 
USING hnsw (embedding vector_cosine_ops);

-- 创建元数据 GIN 索引（支持 JSONB 查询）
CREATE INDEX IF NOT EXISTS knowledge_documents_metadata_idx 
ON knowledge_documents 
USING gin (metadata);

-- 创建城市索引（常用筛选条件）
CREATE INDEX IF NOT EXISTS knowledge_documents_city_idx 
ON knowledge_documents 
USING btree ((metadata->>'city'));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_knowledge_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_documents_updated_at();

-- 添加 RLS 策略（公开读取）
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取知识库
CREATE POLICY "knowledge_documents_select_policy"
ON knowledge_documents
FOR SELECT
TO authenticated, anon
USING (true);

-- 只允许服务端写入
CREATE POLICY "knowledge_documents_insert_policy"
ON knowledge_documents
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "knowledge_documents_update_policy"
ON knowledge_documents
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "knowledge_documents_delete_policy"
ON knowledge_documents
FOR DELETE
TO service_role
USING (true);

-- 创建相似度搜索函数
CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 创建按城市筛选的相似度搜索函数
CREATE OR REPLACE FUNCTION match_knowledge_documents_by_city(
  query_embedding VECTOR(1024),
  city_filter TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.content,
    kd.metadata,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE 
    kd.metadata->>'city' = city_filter
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE knowledge_documents IS 'RAG 知识库文档表，存储旅行景点信息';
COMMENT ON COLUMN knowledge_documents.content IS '文档内容（景点介绍+评论）';
COMMENT ON COLUMN knowledge_documents.metadata IS '元数据：name, city, tags, rating, source';
COMMENT ON COLUMN knowledge_documents.embedding IS '1024维向量嵌入（text-embedding-v3）';
