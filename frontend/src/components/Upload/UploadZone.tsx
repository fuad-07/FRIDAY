import { useState, useRef, type DragEvent } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '@/context/ChatContext'
import { UploadedFileCard } from './UploadedFileCard'
import { toast } from 'sonner'

const ACCEPTED_TYPES = '.pdf,.txt,.md'
const ACCEPTED_MIME = ['application/pdf', 'text/plain', 'text/markdown']

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, upload, removeFile } = useChat()

  const isValidFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    return ACCEPTED_TYPES.includes(ext) || ACCEPTED_MIME.includes(file.type)
  }

  const handleFile = async (file: File) => {
    if (!isValidFile(file)) {
      toast.error('Unsupported file type. Please upload PDF, TXT, or Markdown.')
      return
    }
    try {
      await upload(file)
      toast.success(`"${file.name}" uploaded successfully.`)
    } catch {
      toast.error(`Failed to upload "${file.name}".`)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  return (
    <div className="space-y-2">
      <button
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Upload document"
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-all duration-200',
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-zinc-700/50 bg-zinc-800/20 hover:border-zinc-600/60 hover:bg-zinc-800/30',
        )}
      >
        <Upload className={cn('h-5 w-5 transition-colors', isDragging ? 'text-indigo-400' : 'text-zinc-500')} />
        <div className="text-center">
          <p className="text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Click to upload</span> or drag and drop
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-600">PDF, TXT, Markdown</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {state.uploadedFiles.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Uploaded</p>
          {state.uploadedFiles.map((file) => (
            <UploadedFileCard key={file.id} file={file} onRemove={removeFile} />
          ))}
        </div>
      )}
    </div>
  )
}
