import { useEffect, useRef, useState } from 'react'
import { EllipsisVertical, FileText } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { EmptyState } from './EmptyState'
import { TypingIndicator } from './TypingIndicator'

export function ChatWindow() {
  const { state, send } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showFiles, setShowFiles] = useState(false)
  const currentMessages = state.sessions[state.currentSessionId]?.messages ?? []
  const currentFiles = state.sessionFiles[state.currentSessionId] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, state.isLoading])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFiles(false)
      }
    }
    if (showFiles) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showFiles])

  const hasMessages = currentMessages.length > 0
  const lastMessageIsError = hasMessages && currentMessages[currentMessages.length - 1].content.startsWith('Error:')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-3">
        <h2 className="text-sm font-medium text-zinc-300">Conversation</h2>
        <div className="flex items-center gap-3">
          {currentFiles.length > 0 && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowFiles(!showFiles)}
                aria-label="Session files"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
              {showFiles && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-zinc-800/60 bg-zinc-950 py-2 shadow-xl">
                  <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Session Files
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    {currentFiles.map((fname) => (
                      <div key={fname} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400">
                        <FileText className="h-3 w-3 shrink-0 text-zinc-500" />
                        <span className="truncate">{fname}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-zinc-500">Connected</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {!hasMessages ? (
          <EmptyState onSuggestionClick={send} />
        ) : (
          <div className="mx-auto max-w-3xl">
            {currentMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {state.isLoading && !lastMessageIsError && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={send} disabled={state.isLoading} />
    </div>
  )
}
