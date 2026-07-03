import { motion, type Variants } from 'framer-motion'
import { Sparkles, MessageSquare, FileText, Search, Bot, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TiltCard } from '@/components/ui/TiltCard'
import { cn } from '@/lib/utils'

interface HomePageProps {
  onStart: () => void
}

const features = [
  { icon: FileText, title: 'Document Upload', desc: 'Upload PDF, TXT, or Markdown files for instant knowledge ingestion.' },
  { icon: Search, title: 'RAG Search', desc: 'Semantic search over your documents with intelligent retrieval.' },
  { icon: MessageSquare, title: 'Conversation Memory', desc: 'Session-based context that remembers your entire conversation.' },
  { icon: Sparkles, title: 'Tool Calling', desc: 'Order tracking, product search, and more — triggered by intent.' },
]

const stagger: Variants = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const fadeUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">

      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center px-6 pt-24 pb-24 text-center"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <Sparkles className="h-3 w-3" />
            AI-Powered Assistant
          </span>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Bot className="h-7 w-7 text-white" />
          </div>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mb-3 text-6xl font-bold tracking-tight text-zinc-100 sm:text-7xl"
        >
          Friday
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mb-2 max-w-xl text-lg text-zinc-500"
        >
          Your intelligent assistant with RAG, tool calling, and conversation memory.
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="mb-10 max-w-lg text-sm text-zinc-600"
        >
          Upload documents, ask questions, track orders, search products — all in one place.
        </motion.p>

        <motion.div variants={fadeUp} className="flex gap-4">
          <Button
            onClick={onStart}
            className="h-11 gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl border-zinc-700/50 px-6 text-sm font-medium text-zinc-400 hover:text-zinc-200"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-20 grid w-full gap-4 sm:grid-cols-2"
        >
          {features.map((f) => (
            <TiltCard
              key={f.title}
              className="group rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 text-left transition-colors hover:border-zinc-700/60"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/15">
                <f.icon className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-zinc-200">{f.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{f.desc}</p>
            </TiltCard>
          ))}
        </motion.div>

        <motion.div
          id="about"
          variants={fadeUp}
          className="mt-20 w-full rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-left"
        >
          <h2 className="mb-6 text-lg font-semibold text-zinc-100">About This Project</h2>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
            <p>
              <strong className="text-zinc-200">Friday</strong> is a production-quality AI assistant built with
              FastAPI and React. It combines Retrieval-Augmented Generation (RAG), tool-calling capabilities,
              and conversation memory into a seamless chat experience.
            </p>
            <p>
              Upload your documents (PDF, TXT, Markdown) and Friday ingests them into a vector database.
              Ask questions and it retrieves the most relevant content using semantic search. Need order
              status or product info? Built-in tools handle that automatically.
            </p>
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Backend</h4>
                <ul className="space-y-1 text-xs text-zinc-500">
                  <li>FastAPI (Python)</li>
                  <li>ChromaDB Vector Store</li>
                  <li>Groq LLM (llama-3.1-8b)</li>
                  <li>sentence-transformers</li>
                  <li>LangChain Document Processing</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Frontend</h4>
                <ul className="space-y-1 text-xs text-zinc-500">
                  <li>React 19 + TypeScript</li>
                  <li>Vite + Tailwind CSS</li>
                  <li>Framer Motion</li>
                  <li>shadcn/ui Components</li>
                  <li>Axios API Client</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-12 text-xs text-zinc-700">
          Powered by Groq &middot; Built with FastAPI + React
        </motion.p>
      </motion.div>
    </div>
  )
}
