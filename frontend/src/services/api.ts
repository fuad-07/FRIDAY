import axios from 'axios'
import type { ChatRequest, ChatResponse, UploadResponse } from '@/types'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export async function sendMessage(data: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat', data)
  return response.data
}

export async function uploadDocument(file: File, sessionId?: string): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const params = sessionId ? { session_id: sessionId } : {}
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
    timeout: 120000,
  })
  return response.data
}
