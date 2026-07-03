import { Bot } from 'lucide-react'
import { SuggestionCard } from './SuggestionCard'

const SUGGESTIONS = [
  'What is the refund policy?',
  'Summarize the uploaded document.',
  'Where is my order ORD001?',
  'Do you have a wireless mouse?',
]

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
        <Bot className="h-8 w-8 text-indigo-400" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-100">How can I help today?</h1>
      <p className="mb-10 max-w-md text-sm text-zinc-500">
        Upload documents and start chatting with your knowledge base.
      </p>
      <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <SuggestionCard key={suggestion} text={suggestion} onClick={onSuggestionClick} />
        ))}
      </div>
    </div>
  )
}
