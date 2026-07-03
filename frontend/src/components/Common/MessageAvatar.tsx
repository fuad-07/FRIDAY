import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageAvatarProps {
  role: 'user' | 'assistant'
}

export function MessageAvatar({ role }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        role === 'assistant'
          ? 'bg-indigo-500/15 text-indigo-400'
          : 'bg-zinc-800 text-zinc-300',
      )}
      aria-label={role === 'assistant' ? 'AI Assistant' : 'You'}
    >
      {role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
    </div>
  )
}
