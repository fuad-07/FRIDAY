# Architecture

## AI Pipeline Overview

```
  User
   |
   v
 FastAPI (REST endpoints)
   |
   +--> POST /api/v1/upload --> Loader --> Splitter --> Embeddings --> ChromaDB
   |
   +--> POST /api/v1/chat --> Memory (session history)
                                   |
                                   v
                              Intent Router
                              /    |       \
                             /     |        \
                            v      v         v
                          TOOL   RETRIEVAL  DIRECT CHAT
                           |       |
                           v       v
                         Tool    Vector DB
                         Call    (ChromaDB)
                           |       |
                           +---+---+
                               |
                               v
                          Prompt Builder
                               |
                               v
                         LLM (Groq)
                               |
                               v
                          Response --> Memory --> User
```

## Stage Descriptions

### 1. FastAPI Layer
The entry point. Three main endpoints:
- `POST /api/v1/upload` — document ingestion (PDF, TXT, MD)
- `POST /api/v1/chat` — conversation with RAG and tool calling
- `GET /api/v1/session/{id}/files` — list files uploaded in a session

Automatic OpenAPI/Swagger docs at `/docs`.

CORS is configured for `localhost:5173` and `127.0.0.1:5173` (Vite dev server).

### 2. Ingestion Pipeline (`POST /api/v1/upload`)

1. **Loader** (`app/ingestion/loader.py`):
   - PDF files loaded via `PyPDFLoader` (page-level extraction)
   - TXT/MD files loaded via `TextLoader` (UTF-8)
   - Returns list of `{ text, metadata }` dicts

2. **Splitter** (`app/ingestion/splitter.py`):
   - `RecursiveCharacterTextSplitter` with chunk size 500, overlap 100
   - Separators: `\n\n`, `\n`, `.`, ` `, `""`
   - Each chunk gets a `chunk_id` in metadata

3. **Embeddings** (`app/ingestion/embeddings.py`):
   - `sentence-transformers` with default model `BAAI/bge-small-en-v1.5` (384-dim)
   - Falls back to `all-MiniLM-L6-v2` if the primary model fails to load
   - Singleton pattern — model loaded once, reused across requests

4. **Vector Store** (`app/ingestion/vector_store.py`):
   - ChromaDB with persistent storage (path configured via `CHROMA_PATH`)
   - Cosine similarity space (`hnsw:space: cosine`)
   - Each chunk stored with a UUID, its text, embedding, and metadata (including `session_id` if provided)

### 3. Memory Layer (`app/memory/session_memory.py`)

- **In-memory** dictionary keyed by `session_id`
- Each session stores:
  - Message history (list of `{ role, content }` objects, capped at last 10 messages)
  - File list (filenames uploaded in the session)
- Singleton `SessionMemory` instance, module-level
- **Lost on server restart** — suitable for development/demo, not production

### 4. Intent Router (`app/services/intent_router.py`)

Classifies every incoming message into one of three intents:

| Intent | Triggers | Examples |
|--------|----------|----------|
| `TOOL` | Regex patterns for order tracking and product search | "Where is my order?", "Do you have a wireless mouse?" |
| `DIRECT_CHAT` | Greetings, thanks, farewells, self-introductions, and contextual follow-ups (messages with pronouns or short follow-ups to tool queries) | "Hi", "thanks", "my name is X", "show me cheaper ones" |
| `KNOWLEDGE_RETRIEVAL` | Everything else (default) | Questions about uploaded documents |

The router is regex-based and modular — new intents can be added by extending the pattern lists.

### 5. Tool Layer (`app/tools/`)

Two tools, both reading from JSON files in `data/`:

- **Order Tool** (`order_tool.py`): `get_order_status(order_id)` — looks up order in `data/orders.json` (5 sample orders: ORD001–ORD005)
- **Product Tool** (`product_tool.py`): `search_product(query)` — searches product names and descriptions in `data/products.json` (11 sample products)

Tools are called automatically when the intent is `TOOL`. The tool result is serialized to JSON and injected into the LLM prompt.

### 6. Retrieval Layer (RAG) (`app/rag/retriever.py`)

When the intent is `KNOWLEDGE_RETRIEVAL`:

1. User query is embedded using the same sentence-transformers model used during ingestion
2. Similarity search is performed against ChromaDB with `top_k` results (default 8)
3. If a `session_id` is provided, results are filtered to that session's documents; if no results found, falls back to searching all documents
4. Each result's cosine distance is converted to similarity (`1 - distance`)
5. Chunks above `SIMILARITY_THRESHOLD` (default 0.25) are included in the context
6. If no chunks pass the threshold, the **top-scoring chunk** is returned as a fallback so the LLM still has some context
7. If no results exist at all, returns `None`

### 7. Prompt Builder (`app/rag/prompt_builder.py`)

Constructs the final user prompt from:
- Conversation history (last N exchanges, formatted as `User: ...\nAssistant: ...`)
- Retrieved context (top-K relevant chunks, joined by double newlines)
- Tool result (JSON string from tool execution)
- Current user message

The system prompt enforces:
- Use provided context, not own knowledge, for document questions
- Say "I couldn't find that information in the uploaded documents" when no relevant context
- Do not hallucinate
- Be concise
- Respond naturally for greetings/chat

### 8. LLM Layer (`app/llm/`)

Two client implementations sharing the same `generate(system_prompt, user_prompt) -> str` interface:

- **GroqClient** (default, `groq_client.py`):
  - Model: `llama-3.1-8b-instant` (configurable via `LLM_MODEL`)
  - Temperature: 0.3, max tokens: 1024
  - Requires `GROQ_API_KEY` in `.env`

- **GeminiClient** (alternative, `gemini_client.py`):
  - Model: `gemini-2.5-flash-lite`
  - Requires `GEMINI_API_KEY` in `.env`

The active client is selected in `chat_service.py` — currently hardcoded to GroqClient.

### 9. Chat Service (`app/services/chat_service.py`)

Orchestrates the full chat pipeline:

1. Retrieve session history from memory
2. Classify intent via regex router
3. Execute tool or run retrieval based on intent
4. Build system + user prompts with context/history/tool results
5. Call LLM client
6. Handle errors with user-friendly messages (missing API key, rate limit, generic error)
7. Store the exchange in session memory
8. Return answer + list of session files

## Design Decisions

- **Modular architecture**: Each concern is separated into its own module. Adding a new tool, LLM provider, or intent only requires adding new files and registering them.
- **Strategy pattern for LLM clients**: Both GroqClient and GeminiClient implement the same interface, making them swappable.
- **Singleton pattern**: Session memory and embedding model are module-level singletons.
- **In-memory memory**: Simple and fast for single-server deployment. Can be replaced with Redis or a database for production scaling.
- **Regex-based intent routing**: Lightweight and predictable. For complex cases, an LLM-based classifier can be swapped in.
- **Fallback retrieval**: If no chunks pass the similarity threshold, the top-scoring chunk is still provided to the LLM rather than returning nothing.
- **sentence-transformers for embeddings**: Local execution, no API dependency, fast for moderate document sizes.

## Configuration (`.env`)

| Variable               | Default                      | Description                     |
|-----------------------|------------------------------|---------------------------------|
| `GROQ_API_KEY`        | —                            | Groq API key                    |
| `LLM_MODEL`           | `llama-3.1-8b-instant`       | Groq model name                 |
| `CHROMA_PATH`         | `./chroma_db`                | ChromaDB persistence path       |
| `EMBEDDING_MODEL`     | `BAAI/bge-small-en-v1.5`     | sentence-transformers model     |
| `TOP_K`               | `8`                          | Number of chunks to retrieve    |
| `SIMILARITY_THRESHOLD`| `0.25`                       | Minimum cosine similarity       |

## Limitations

- In-memory conversation memory is lost on server restart
- Regex-based intent routing may miss edge cases
- Single LLM provider active per request (Groq by default)
- No authentication or rate limiting
- No streaming responses
- No document deletion/update endpoints

## Future Improvements

- Persistent memory (Redis, PostgreSQL)
- LLM-based intent classification
- Multi-provider LLM support with automatic fallback
- Streaming responses via SSE
- Authentication and rate limiting
- Document deletion/update endpoints
- Full-text search hybrid with vector search
- Async embedding generation
- File type validation via magic bytes
- Unit and integration tests
- Docker containerization
