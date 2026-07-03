# AI Assistant Backend

A production-quality AI Assistant backend built with FastAPI, featuring RAG (Retrieval-Augmented Generation), tool calling, conversation memory, and document ingestion.

## Features

- **Knowledge Ingestion**: Upload PDF, TXT, and Markdown files. Documents are chunked (500 chars, 100 overlap), embedded via sentence-transformers, and stored in a persistent ChromaDB vector store.
- **Retrieval-Augmented Generation (RAG)**: Semantic search over uploaded documents with configurable top-K (default 8) and similarity threshold (default 0.25). Falls back to the best-matching chunk when no results pass the threshold.
- **Conversation Memory**: Session-based in-memory history (last 10 messages) that supports contextual follow-up questions.
- **Tool Calling**: Built-in tools for order status lookup and product search, automatically triggered by regex-based intent classification.
- **Intent Routing**: Classifies every message as `TOOL`, `KNOWLEDGE_RETRIEVAL`, or `DIRECT_CHAT` using regex patterns.
- **LLM Provider**: Uses Groq (default model `llama-3.1-8b-instant`) with a swappable client interface — a Gemini client is also available.
- **FastAPI REST API**: Well-documented endpoints with automatic Swagger UI at `/docs`.

## Tech Stack

| Component       | Technology                               |
|----------------|------------------------------------------|
| Language       | Python 3.11+                             |
| Framework      | FastAPI                                  |
| LLM            | Groq (`llama-3.1-8b-instant`)            |
| Alt. LLM       | Google Gemini (`gemini-2.5-flash-lite`)  |
| Embeddings     | sentence-transformers (`BAAI/bge-small-en-v1.5`, fallback `all-MiniLM-L6-v2`) |
| Vector DB      | ChromaDB (persistent, cosine similarity) |
| Document Proc. | LangChain (PyPDFLoader, TextLoader, RecursiveCharacterTextSplitter) |

## Architecture

See [architecture.md](architecture.md) for a detailed explanation of the AI pipeline.

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI entry point (CORS, error handling)
│   ├── config.py                # Pydantic settings from .env
│   ├── api/
│   │   ├── upload.py            # POST /api/v1/upload
│   │   └── chat.py              # POST /api/v1/chat, GET /api/v1/session/{id}/files
│   ├── ingestion/
│   │   ├── loader.py            # PDF (PyPDF), TXT/MD (TextLoader)
│   │   ├── splitter.py          # RecursiveCharacterTextSplitter (500/100)
│   │   ├── embeddings.py        # sentence-transformers (singleton)
│   │   └── vector_store.py      # ChromaDB add/query
│   ├── rag/
│   │   ├── retriever.py         # Semantic search + threshold filter + fallback
│   │   └── prompt_builder.py    # System/user prompt construction
│   ├── memory/
│   │   └── session_memory.py    # In-memory session history (10 msg limit)
│   ├── tools/
│   │   ├── order_tool.py        # Order lookup from data/orders.json
│   │   └── product_tool.py      # Product search from data/products.json
│   ├── llm/
│   │   ├── groq_client.py       # Groq API client (default)
│   │   └── gemini_client.py     # Gemini API client (alternative)
│   ├── services/
│   │   ├── intent_router.py     # Regex-based intent classification
│   │   └── chat_service.py      # Chat orchestration pipeline
│   └── models/
│       ├── request_models.py    # Pydantic request schemas
│       └── response_models.py   # Pydantic response schemas
├── data/
│   ├── orders.json              # 5 sample orders
│   └── products.json            # 11 sample products
├── uploads/                     # Uploaded files (gitignored)
├── chroma_db/                   # ChromaDB persistent store (gitignored)
├── architecture.md              # Pipeline architecture doc
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (gitignored)
└── .env.example                 # Environment template
```

## Installation

### Prerequisites

- Python 3.11 or higher
- A Groq API key at https://console.groq.com/keys

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GROQ_API_KEY
```

### Configuration (`.env`)

| Variable               | Default                      | Description                  |
|-----------------------|------------------------------|------------------------------|
| `GROQ_API_KEY`        | —                            | Groq API key (required)      |
| `LLM_MODEL`           | `llama-3.1-8b-instant`       | Groq model name              |
| `CHROMA_PATH`         | `./chroma_db`                | ChromaDB persistence path    |
| `EMBEDDING_MODEL`     | `BAAI/bge-small-en-v1.5`     | sentence-transformers model  |
| `TOP_K`               | `8`                          | Number of chunks to retrieve |
| `SIMILARITY_THRESHOLD`| `0.25`                       | Minimum cosine similarity    |

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### `GET /health`

Health check.

```json
{ "status": "healthy" }
```

### `POST /api/v1/upload`

Upload a document for knowledge ingestion.

**Request**: `multipart/form-data` with a `file` field and optional `session_id` query param.

**Supported formats**: PDF, TXT, Markdown

```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@document.pdf"
```

**Response**:
```json
{
  "filename": "document.pdf",
  "chunks": 12,
  "message": "Successfully ingested 'document.pdf' (12 chunks)."
}
```

### `POST /api/v1/chat`

Send a message to the AI assistant.

**Request**:
```json
{
  "session_id": "abc123",
  "message": "What is the return policy?"
}
```

**Response**:
```json
{
  "answer": "Based on the uploaded documents, returns are accepted within 30 days...",
  "session_files": ["policy.pdf"]
}
```

### `GET /api/v1/session/{session_id}/files`

Get files uploaded in a session.

```json
{ "session_files": ["policy.pdf"] }
```

## Tool Examples

### Order Status
```
User: Where is my order ORD001?
Assistant: Order ORD001 is currently shipped and estimated to arrive by 2025-01-20.
```

### Product Search
```
User: Do you have a wireless mouse?
Assistant: Yes, we have a Wireless Mouse priced at $29.99 with 150 units in stock.
```

### Contextual Follow-up
```
User: I'm looking for a laptop.
User: Show me cheaper options.
Assistant: The most affordable laptop we have is priced at $999.99.
```

## Design Decisions

- **Modular architecture**: Each concern is separated into its own module for maintainability and testability.
- **Regex-based intent routing**: Lightweight and predictable; can be swapped for LLM-based routing.
- **Local embeddings**: sentence-transformers run locally, no external API dependency for embeddings.
- **Clean separation of prompts**: System prompts are separated from application logic in `prompt_builder.py`.
- **Swappable LLM clients**: Both GroqClient and GeminiClient implement the same `generate()` interface.

## Limitations

- Conversation memory is in-memory (lost on restart)
- Intent routing uses regex patterns (may miss edge cases)
- Single LLM provider active per request (Groq by default)
- No authentication or rate limiting
- No streaming responses

## Future Improvements

- Persistent memory (Redis/PostgreSQL)
- LLM-based intent classification
- Multi-provider LLM support with automatic fallback
- Streaming responses via SSE
- Authentication and rate limiting
- Document deletion/update endpoints
- Full-text + vector hybrid search
- Async embedding generation
- File type validation via magic bytes
- Unit and integration test suite
- Docker containerization
