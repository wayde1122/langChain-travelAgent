# RAG Knowledge Enhancement Specification

## ADDED Requirements

### Requirement: Knowledge Document Storage

The system SHALL store knowledge documents as vector embeddings in Supabase pgvector for efficient semantic search.

#### Scenario: Store document with embedding

- **WHEN** a knowledge document is ingested
- **THEN** the document content is split into chunks
- **AND** each chunk is converted to a 1024-dimensional vector embedding
- **AND** the chunk content, metadata, and embedding are stored in the `knowledge_documents` table

#### Scenario: Support multiple document formats

- **WHEN** documents are loaded from the knowledge directory
- **THEN** Markdown (.md), JSON (.json), and plain text (.txt) formats are supported
- **AND** document metadata (source file, category, tags) is preserved

### Requirement: Document Chunking

The system SHALL split long documents into semantically coherent chunks for better retrieval quality.

#### Scenario: Split document by semantic boundaries

- **WHEN** a document is processed for ingestion
- **THEN** it is split using RecursiveCharacterTextSplitter
- **AND** chunk size is approximately 1000 characters
- **AND** chunks overlap by 200 characters for context continuity
- **AND** splits occur at natural boundaries (paragraphs, sentences)

### Requirement: Knowledge Retrieval

The system SHALL retrieve relevant knowledge based on user queries using semantic similarity search.

#### Scenario: Retrieve relevant documents

- **WHEN** a user asks a travel-related question
- **THEN** the question is converted to a vector embedding
- **AND** the system searches for similar documents using cosine similarity
- **AND** the top-K most relevant documents (K=5) are returned

#### Scenario: Filter by similarity threshold

- **WHEN** retrieving documents
- **THEN** only documents with similarity score above 0.7 are included
- **AND** irrelevant results are filtered out

### Requirement: RAG Context Injection

The system SHALL inject retrieved knowledge into the Agent's context before generating responses.

#### Scenario: Enhance response with knowledge

- **WHEN** relevant knowledge is retrieved
- **THEN** the knowledge content is formatted and injected into the Agent prompt
- **AND** the Agent is instructed to prioritize this knowledge in its response
- **AND** the source of information is attributed in the response

#### Scenario: Fallback without knowledge

- **WHEN** no relevant knowledge is found (similarity below threshold)
- **THEN** the Agent responds using its general knowledge
- **AND** indicates that specific information may not be available

### Requirement: Knowledge Ingestion Script

The system SHALL provide a CLI script for batch importing knowledge documents.

#### Scenario: Ingest knowledge directory

- **WHEN** the ingestion script is run with a directory path
- **THEN** all supported documents in the directory are processed
- **AND** documents are chunked, embedded, and stored
- **AND** progress and statistics are logged

#### Scenario: Incremental update

- **WHEN** a document is re-ingested
- **THEN** existing embeddings for that document are updated
- **AND** duplicate entries are prevented using content hash
