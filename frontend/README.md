# AI Assistant Frontend

React + TypeScript frontend for the Friday AI assistant. Features a dark-themed chat interface with document upload, session management, markdown rendering, and an animated Three.js background.

## Tech Stack

| Component       | Technology                          |
|----------------|-------------------------------------|
| Language       | TypeScript 6                        |
| UI Library     | React 19                            |
| Build Tool     | Vite 8                              |
| Styling        | Tailwind CSS 4 + tailwindcss-animate|
| Components     | shadcn/ui (Radix primitives)        |
| Animation      | Framer Motion 12                    |
| 3D Background  | Three.js + @react-three/fiber + drei|
| Icons          | Lucide React                        |
| HTTP Client    | Axios                               |
| Markdown       | react-markdown + remark-gfm + rehype-highlight |
| Notifications  | Sonner                              |
| Linting        | Oxlint                              |

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component (home vs chat routing)
│   ├── index.css                 # Tailwind + shadcn/ui theme variables
│   ├── types/index.ts            # TypeScript interfaces
│   ├── lib/utils.ts              # cn() utility
│   ├── services/api.ts           # Axios API client
│   ├── context/ChatContext.tsx    # Global state (useReducer + Context)
│   └── components/
│       ├── Chat/
│       │   ├── ChatWindow.tsx     # Main chat container
│       │   ├── ChatInput.tsx      # Text input + file upload button
│       │   ├── ChatMessage.tsx    # Message bubble with markdown
│       │   ├── EmptyState.tsx     # Landing state with suggestion cards
│       │   ├── SuggestionCard.tsx # Clickable suggestion prompt
│       │   └── TypingIndicator.tsx# "Thinking" animated dots
│       ├── Sidebar/
│       │   └── Sidebar.tsx        # Session list, new chat, file browser
│       ├── Home/
│       │   └── HomePage.tsx       # Landing page with features + about
│       ├── Common/
│       │   ├── MessageAvatar.tsx  # User/AI avatar icons
│       │   └── LoadingSpinner.tsx # SVG spinner
│       ├── Upload/
│       │   ├── UploadZone.tsx     # Drag-and-drop file upload
│       │   └── UploadedFileCard.tsx# Upload status card
│       ├── ui/                    # shadcn/ui primitives
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── separator.tsx
│       │   ├── scroll-area.tsx
│       │   ├── badge.tsx
│       │   └── TiltCard.tsx       # 3D tilt-on-hover card
│       └── background/           # Three.js animated background
│           ├── AnimatedBackground.tsx
│           ├── BackgroundController.tsx
│           ├── AuroraLayer.tsx
│           ├── MeshLayer.tsx
│           ├── ParticleLayer.tsx
│           └── NeuralConnections.tsx
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── components.json              # shadcn/ui config
├── .oxlintrc.json               # Oxlint linter config
└── package.json
```

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`. The backend API is expected at `http://127.0.0.1:8000` (configurable in `src/services/api.ts`).

### Build

```bash
npm run build
```

Produces a production build in `dist/`.

### Lint

```bash
npm run lint
```

## Features

- **Chat Interface**: Dark-themed chat with user/assistant message bubbles, markdown rendering (GFM + syntax highlighting), and typing indicator
- **Document Upload**: Upload PDF, TXT, and Markdown files via file picker or drag-and-drop
- **Session Management**: Multiple concurrent chat sessions with per-session history and file tracking
- **File Browser**: View files uploaded in the current session via the sidebar
- **Animated Background**: Three.js scene with aurora shader, wireframe mesh, floating particles, and neural connection lines
- **Responsive Design**: Adapts to different screen sizes with a collapsible sidebar
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for newline

## API Configuration

The API client is configured in `src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
})
```

Update the `baseURL` to point to your backend server.
