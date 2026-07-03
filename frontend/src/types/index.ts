export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  answer: string
  session_files?: string[]
}

export interface UploadResponse {
  filename: string
  chunks: number
  message: string
}

export interface UploadedFile {
  id: string
  name: string
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  timestamp: number
}
