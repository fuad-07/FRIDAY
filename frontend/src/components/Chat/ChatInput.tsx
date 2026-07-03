import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '@/context/ChatContext'
import { toast } from 'sonner'

const ACCEPTED_TYPES = '.pdf,.txt,.md'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload } = useChat()

  const adjustHeight = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = '0'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = ''

    const invalid = files.find((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !ACCEPTED_TYPES.includes(ext)
    })
    if (invalid) {
      toast.error(`"${invalid.name}" is not supported. Upload PDF, TXT, or Markdown.`)
      return
    }

    const results = await Promise.allSettled(files.map((f) => upload(f)))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    if (succeeded > 0) toast.success(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded.`)
    if (failed > 0) toast.error(`${failed} upload${failed > 1 ? 's' : ''} failed.`)
  }

  return (
    <div className="border-t border-zinc-800/60 bg-zinc-900/50 px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-700/50 bg-zinc-800/40 px-3 py-2 transition-colors focus-within:border-zinc-600">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-700/50 hover:text-zinc-300"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={disabled}
          aria-label="Chat input"
          className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
            value.trim() && !disabled
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-zinc-700 text-zinc-500',
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-zinc-600">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  )
}
