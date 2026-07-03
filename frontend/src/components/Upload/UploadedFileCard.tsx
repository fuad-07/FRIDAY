import { FileText, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { UploadedFile } from '@/types'
import { cn } from '@/lib/utils'

interface UploadedFileCardProps {
  file: UploadedFile
  onRemove: (id: string) => void
}

export function UploadedFileCard({ file, onRemove }: UploadedFileCardProps) {
  const statusIcon = {
    uploading: <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />,
    success: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
    error: <AlertCircle className="h-3 w-3 text-red-500" />,
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
        file.status === 'error'
          ? 'border-red-800/40 bg-red-950/20'
          : 'border-zinc-700/30 bg-zinc-800/20',
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-zinc-300">{file.name}</p>
        {file.error && <p className="text-[10px] text-red-400">{file.error}</p>}
      </div>
      {statusIcon[file.status]}
      <button
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-zinc-700/50 group-hover:opacity-100"
      >
        <X className="h-3 w-3 text-zinc-500" />
      </button>
    </div>
  )
}
