import { createContext, useContext, useCallback, useReducer, type ReactNode } from 'react'
import type { Message, Session, UploadedFile } from '@/types'
import { sendMessage, uploadDocument } from '@/services/api'

interface ChatState {
  sessions: Record<string, Session>
  sessionOrder: string[]
  currentSessionId: string
  isLoading: boolean
  isUploading: boolean
  uploadedFiles: UploadedFile[]
  sessionFiles: Record<string, string[]>
  error: string | null
}

type Action =
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: Message } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_UPLOADED_FILE'; payload: UploadedFile }
  | { type: 'UPDATE_UPLOADED_FILE'; payload: { id: string; status: UploadedFile['status']; error?: string } }
  | { type: 'REMOVE_UPLOADED_FILE'; payload: string }
  | { type: 'NEW_SESSION' }
  | { type: 'SWITCH_SESSION'; payload: string }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_SESSION_FILES'; payload: { sessionId: string; files: string[] } }

function createSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    timestamp: Date.now(),
  }
}

function getOrCreateCurrentSession(): string {
  const stored = sessionStorage.getItem('current_session_id')
  if (stored) return stored
  const id = crypto.randomUUID()
  sessionStorage.setItem('current_session_id', id)
  return id
}

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const { sessionId, message } = action.payload
      const session = state.sessions[sessionId]
      if (!session) return state
      const updatedSession: Session = {
        ...session,
        messages: [...session.messages, message],
        title: session.messages.length === 0 && message.role === 'user'
          ? message.content.slice(0, 60)
          : session.title,
      }
      return {
        ...state,
        sessions: { ...state.sessions, [sessionId]: updatedSession },
      }
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'ADD_UPLOADED_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] }
    case 'UPDATE_UPLOADED_FILE':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.map((f) =>
          f.id === action.payload.id ? { ...f, status: action.payload.status, error: action.payload.error } : f,
        ),
      }
    case 'REMOVE_UPLOADED_FILE':
      return { ...state, uploadedFiles: state.uploadedFiles.filter((f) => f.id !== action.payload) }
    case 'NEW_SESSION': {
      const session = createSession()
      sessionStorage.setItem('current_session_id', session.id)
      return {
        ...state,
        sessions: { ...state.sessions, [session.id]: session },
        sessionOrder: [session.id, ...state.sessionOrder],
        currentSessionId: session.id,
        error: null,
      }
    }
    case 'SWITCH_SESSION': {
      sessionStorage.setItem('current_session_id', action.payload)
      return { ...state, currentSessionId: action.payload, error: null }
    }
    case 'DELETE_SESSION': {
      const { [action.payload]: _, ...remaining } = state.sessions
      const newOrder = state.sessionOrder.filter((id) => id !== action.payload)
      const needsNew = newOrder.length === 0
      if (needsNew) {
        const newSession = createSession()
        sessionStorage.setItem('current_session_id', newSession.id)
        return {
          ...state,
          sessions: { ...remaining, [newSession.id]: newSession },
          sessionOrder: [newSession.id],
          currentSessionId: newSession.id,
        }
      }
      const wasCurrent = action.payload === state.currentSessionId
      const nextId = wasCurrent ? newOrder[0] : state.currentSessionId
      sessionStorage.setItem('current_session_id', nextId)
      return {
        ...state,
        sessions: remaining,
        sessionOrder: newOrder,
        currentSessionId: nextId,
      }
    }
    case 'SET_SESSION_FILES':
      return {
        ...state,
        sessionFiles: { ...state.sessionFiles, [action.payload.sessionId]: action.payload.files },
      }
    default:
      return state
  }
}

interface ChatContextValue {
  state: ChatState
  send: (content: string) => Promise<void>
  upload: (file: File) => Promise<void>
  removeFile: (id: string) => void
  newSession: () => void
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

const initialSessionId = getOrCreateCurrentSession()
const initialSession = {
  id: initialSessionId,
  title: 'New Chat',
  messages: [] as Message[],
  timestamp: Date.now(),
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    sessions: { [initialSessionId]: initialSession },
    sessionOrder: [initialSessionId],
    currentSessionId: initialSessionId,
    isLoading: false,
    isUploading: false,
    uploadedFiles: [],
    sessionFiles: {},
    error: null,
  })

  const currentMessages = state.sessions[state.currentSessionId]?.messages ?? []

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return

      const sessionId = state.currentSessionId
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }
      dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: userMessage } })
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      try {
        const response = await sendMessage({ session_id: sessionId, message: content.trim() })
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          timestamp: Date.now(),
        }
        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: assistantMessage } })
        if (response.session_files) {
          dispatch({ type: 'SET_SESSION_FILES', payload: { sessionId, files: response.session_files } })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection lost. Please try again.'
        dispatch({ type: 'SET_ERROR', payload: message })
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${message}`,
          timestamp: Date.now(),
        }
        dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: errorMessage } })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.isLoading, state.currentSessionId],
  )

  const upload = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID()
    const uploadedFile: UploadedFile = { id: fileId, name: file.name, status: 'uploading' }
    dispatch({ type: 'ADD_UPLOADED_FILE', payload: uploadedFile })
    dispatch({ type: 'SET_UPLOADING', payload: true })

    try {
      await uploadDocument(file, state.currentSessionId)
      dispatch({ type: 'UPDATE_UPLOADED_FILE', payload: { id: fileId, status: 'success' } })
      dispatch({ type: 'SET_SESSION_FILES', payload: {
        sessionId: state.currentSessionId,
        files: [...(state.sessionFiles[state.currentSessionId] || []), file.name],
      }})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      dispatch({ type: 'UPDATE_UPLOADED_FILE', payload: { id: fileId, status: 'error', error: message } })
      throw err
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false })
    }
  }, [state.currentSessionId, state.sessionFiles])

  const removeFile = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_UPLOADED_FILE', payload: id })
  }, [])

  const newSession = useCallback(() => {
    dispatch({ type: 'NEW_SESSION' })
  }, [])

  const switchSession = useCallback((id: string) => {
    dispatch({ type: 'SWITCH_SESSION', payload: id })
  }, [])

  const deleteSession = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: id })
  }, [])

  return (
    <ChatContext.Provider value={{ state, send, upload, removeFile, newSession, switchSession, deleteSession }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
