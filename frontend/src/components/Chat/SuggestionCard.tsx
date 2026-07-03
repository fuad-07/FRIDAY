import { Sparkles } from 'lucide-react'

interface SuggestionCardProps {
  text: string
  onClick: (text: string) => void
}

export function SuggestionCard({ text, onClick }: SuggestionCardProps) {
  return (
    <button
      onClick={() => onClick(text)}
      className="group flex items-start gap-2.5 rounded-xl border border-zinc-700/40 bg-zinc-800/20 px-3.5 py-2.5 text-left text-sm text-zinc-400 transition-all duration-200 hover:border-zinc-600/60 hover:bg-zinc-800/50 hover:text-zinc-200"
    >
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400/60 group-hover:text-indigo-400" />
      <span>{text}</span>
    </button>
  )
}
