# Friday — AI Assistant with RAG, Tool Calling & Document Intelligence

**Friday** is a production-ready AI assistant that combines Retrieval-Augmented Generation (RAG), tool-based task execution, conversation memory, and document ingestion into a seamless chat experience. Users can upload PDF, TXT, or Markdown documents, ask questions about their content, check order statuses, search products, and maintain natural contextual conversations — all through a single chat interface.

The system is built as a full-stack application with a **FastAPI** (Python) backend and a **React + TypeScript** (Vite) frontend, featuring an animated Three.js background and a dark-themed responsive UI.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Design Decisions](#design-decisions)
- [Limitations](#limitations)
- [Roadmap](#roadmap)

---

## Architecture Overview

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

### Pipeline Stages

1. **Ingestion**: Uploaded documents (PDF, TXT, MD) are loaded via LangChain loaders, split into chunks (500 characters with 100-character overlap), embedded using `sentence-transformers` (`BAAI/bge-small-en-v1.5`), and stored in a persistent ChromaDB vector store with session-level metadata.

2. **Memory**: In-memory session-based conversation history stores the last 10 messages per session, enabling contextual follow-ups.

3. **Intent Routing**: Every incoming message is classified into one of three intents using regex patterns:
   - `TOOL` — order tracking or product search queries
   - `KNOWLEDGE_RETRIEVAL` — questions about uploaded documents
   - `DIRECT_CHAT` — greetings, casual conversation, and contextual follow-ups

4. **Tool Execution**: Built-in tools query sample JSON datasets for order status lookups (`data/orders.json`) and product searches (`data/products.json`). Results are injected directly into the LLM prompt.

5. **Retrieval (RAG)**: Queries are embedded and searched against ChromaDB using cosine similarity. Results are filtered by a configurable similarity threshold (default 0.25). If no chunks pass the threshold, the top-scoring chunk is returned as a fallback to provide the LLM with available context.

6. **Prompt Construction**: The final prompt is assembled from system instructions (anti-hallucination, honesty, conciseness), conversation history, retrieved context or tool results, and the current user message.

7. **LLM Response**: The prompt is sent to **Groq** (default model `llama-3.1-8b-instant`) for response generation. A **Google Gemini** client is also available as a swappable alternative.

---

## Features

### Document Intelligence
- Upload PDF, TXT, and Markdown files via file picker or drag-and-drop
- Automatic document chunking, embedding, and ingestion into a persistent vector store
- Semantic search over uploaded documents with configurable threshold and top-K
- Per-session document isolation and fallback to global search

### Conversational Chat
- Dark-themed responsive chat interface with markdown rendering (GFM + syntax highlighting)
- Session-based conversation history supporting contextual follow-ups
- Typing indicator, error handling, and connection status feedback

### Built-in Tools
- **Order Status Lookup**: Query sample order data by order ID
- **Product Search**: Search a sample product catalog by name or description

### User Interface
- Landing page with feature overview and tech stack breakdown
- Sidebar with session management, file browser, and global uploads
- Animated Three.js background with aurora shader, wireframe mesh, floating particles, and neural connection lines
- Drag-and-drop file upload with per-file progress and status indicators
- Performance-aware: pauses animations on tab hide, respects `prefers-reduced-motion`

---

## Tech Stack

### Backend

| Component            | Technology                                    |
|----------------------|-----------------------------------------------|
| Language             | Python 3.11+                                  |
| Framework            | FastAPI                                       |
| LLM Provider         | Groq (`llama-3.1-8b-instant`)                 |
| Alternative LLM      | Google Gemini (`gemini-2.5-flash-lite`)        |
| Embeddings           | sentence-transformers (`BAAI/bge-small-en-v1.5`) |
| Vector Database      | ChromaDB (persistent, cosine similarity)       |
| Document Processing  | LangChain (PyPDFLoader, TextLoader, RecursiveCharacterTextSplitter) |

### Frontend

| Component            | Technology                                    |
|----------------------|-----------------------------------------------|
| Language             | TypeScript 6                                  |
| UI Library           | React 19                                      |
| Build Tool           | Vite 8                                        |
| Styling              | Tailwind CSS 4 + tailwindcss-animate           |
| UI Components        | shadcn/ui (Radix primitives)                  |
| Animation            | Framer Motion 12                              |
| 3D Graphics          | Three.js + @react-three/fiber + @react-three/drei |
| HTTP Client          | Axios                                         |
| Markdown Rendering   | react-markdown + remark-gfm + rehype-highlight |

---

## Project Structure

```
friday/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point (CORS, error handling, routers)
│   │   ├── config.py                # Pydantic Settings from .env
│   │   ├── api/
│   │   │   ├── upload.py            # POST /api/v1/upload
│   │   │   └── chat.py              # POST /api/v1/chat, GET /api/v1/session/{id}/files
│   │   ├── ingestion/
│   │   │   ├── loader.py            # Document loading (PDF via PyPDF, TXT/MD via TextLoader)
│   │   │   ├── splitter.py          # RecursiveCharacterTextSplitter (500/100)
│   │   │   ├── embeddings.py        # sentence-transformers (singleton, with fallback)
│   │   │   └── vector_store.py      # ChromaDB operations (store, get collection)
│   │   ├── rag/
│   │   │   ├── retriever.py         # Semantic search + threshold filtering + fallback
│   │   │   └── prompt_builder.py    # System/user prompt construction
│   │   ├── memory/
│   │   │   └── session_memory.py    # In-memory session history (10-message limit)
│   │   ├── tools/
│   │   │   ├── order_tool.py        # Order status lookup from data/orders.json
│   │   │   └── product_tool.py      # Product search from data/products.json
│   │   ├── llm/
│   │   │   ├── groq_client.py       # Groq API client (default)
│   │   │   └── gemini_client.py     # Gemini API client (alternative)
│   │   ├── services/
│   │   │   ├── intent_router.py     # Regex-based intent classification
│   │   │   └── chat_service.py      # Chat orchestration pipeline
│   │   └── models/
│   │       ├── request_models.py    # Pydantic request schemas
│   │       └── response_models.py   # Pydantic response schemas
│   ├── data/
│   │   ├── orders.json              # Sample order data (5 orders)
│   │   └── products.json            # Sample product catalog (11 products)
│   ├── uploads/                     # Uploaded files (gitignored)
│   ├── chroma_db/                   # ChromaDB persistent store (gitignored)
│   ├── requirements.txt
│   ├── .env.example
│   ├── README.md
│   └── architecture.md
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root component (home/chat routing)
│   │   ├── index.css                # Tailwind + shadcn/ui theme variables
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── lib/utils.ts             # cn() utility
│   │   ├── services/api.ts          # Axios API client
│   │   ├── context/ChatContext.tsx  # Global state (useReducer + Context)
│   │   └── components/
│   │       ├── Chat/                # ChatWindow, ChatInput, ChatMessage, EmptyState, etc.
│   │       ├── Sidebar/             # Session list, file browser
│   │       ├── Home/                # Landing page
│   │       ├── Common/              # MessageAvatar, LoadingSpinner
│   │       ├── Upload/              # UploadZone, UploadedFileCard
│   │       ├── ui/                  # shadcn/ui primitives (button, card, badge, etc.)
│   │       └── background/          # Three.js animated background layers
│   ├── public/                      # favicon.svg, icons.svg
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig*.json
│   └── components.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+
- **npm** 10+
- A **Groq API key** (get one at [console.groq.com/keys](https://console.groq.com/keys))

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GROQ_API_KEY
```

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install
```

### Running the Application

Start the backend (from `backend/`):

```bash
uvicorn app.main:app --reload --port 8000
```

Start the frontend (from `frontend/`, in a separate terminal):

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

The backend API will be available at `http://localhost:8000` with interactive documentation at `http://localhost:8000/docs`.

---

## API Reference

### `GET /health`

Returns the health status of the API.

**Response**:
```json
{ "status": "healthy" }
```

---

### `POST /api/v1/upload`

Upload a document for knowledge ingestion.

**Request**: `multipart/form-data`
- `file` (required) — The document file (PDF, TXT, or Markdown)
- `session_id` (optional, query param) — Associates the document with a chat session

**Response**:
```json
{
  "filename": "document.pdf",
  "chunks": 12,
  "message": "Successfully ingested 'document.pdf' (12 chunks)."
}
```

---

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
  "answer": "Based on the uploaded documents, returns are accepted within 30 days of purchase with the original receipt.",
  "session_files": ["policy.pdf"]
}
```

---

### `GET /api/v1/session/{session_id}/files`

Retrieve the list of files uploaded in a given session.

**Response**:
```json
{
  "session_files": ["policy.pdf", "notes.txt"]
}
```

---

## Configuration

All backend configuration is managed through environment variables in `backend/.env`:

| Variable                | Default                      | Description                              |
|-------------------------|------------------------------|------------------------------------------|
| `GROQ_API_KEY`          | —                            | Groq API key                             |
| `LLM_MODEL`             | `llama-3.1-8b-instant`       | Groq model identifier                    |
| `CHROMA_PATH`           | `./chroma_db`                | ChromaDB persistence directory           |
| `EMBEDDING_MODEL`       | `BAAI/bge-small-en-v1.5`     | sentence-transformers model name         |
| `TOP_K`                 | `8`                          | Number of chunks to retrieve per query   |
| `SIMILARITY_THRESHOLD`  | `0.25`                       | Minimum cosine similarity for relevance  |

---

## Design Decisions

- **Modular architecture**: Each concern (ingestion, retrieval, memory, tools, LLM) is isolated in its own module, making the system easy to extend and maintain.
- **Strategy pattern for LLM clients**: GroqClient and GeminiClient implement a common `generate()` interface, enabling seamless provider swapping.
- **Regex-based intent routing**: Lightweight and deterministic. Can be replaced with an LLM-based classifier for more complex scenarios.
- **Local embeddings**: sentence-transformers run entirely on-device, eliminating external API dependencies for embedding generation.
- **Fallback retrieval**: When no chunks meet the similarity threshold, the best-matching chunk is still provided to the LLM rather than returning no context.
- **Singleton pattern**: Session memory and the embedding model are instantiated once and reused, minimizing resource overhead.

---

## Limitations

- **In-memory memory**: Conversation history and session data are stored in memory and will be lost on server restart.
- **Regex-based routing**: May fail on edge cases or complex phrasing that doesn't match the predefined patterns.
- **Single active LLM provider**: While multiple clients exist, only Groq is active by default.
- **No authentication or rate limiting**: The API is open by default — not suitable for production deployment without additional security measures.
- **No streaming responses**: The LLM response is returned in full rather than streamed token-by-token.
- **Sample data only**: Order and product data are static JSON files intended for demonstration purposes.

---

## Roadmap

- [ ] Persistent memory backend (Redis, PostgreSQL)
- [ ] LLM-based intent classification
- [ ] Multi-provider LLM support with automatic fallback
- [ ] Streaming responses via Server-Sent Events
- [ ] Authentication and rate limiting
- [ ] Document deletion and update endpoints
- [ ] Full-text search hybrid with vector search
- [ ] Async embedding generation
- [ ] File type validation via magic bytes
- [ ] Unit and integration test suite
- [ ] Docker containerization
- [ ] CI/CD pipeline
