import { useState } from 'react'
import { Bot, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, FileText, Home, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useChat } from '@/context/ChatContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onHome?: () => void
}

export function Sidebar({ isOpen, onToggle, onHome }: SidebarProps) {
  const { state, newSession, switchSession, deleteSession } = useChat()
  const currentFiles = state.sessionFiles[state.currentSessionId] || []
  const allFiles = [...new Set(Object.values(state.sessionFiles).flat())]
  const [showAllFiles, setShowAllFiles] = useState(false)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-zinc-800/60 bg-zinc-950 transition-all duration-300 md:relative',
          isOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:w-0 md:-translate-x-full',
        )}
      >
        <div className="flex h-full w-[280px] flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={onHome} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-sm font-semibold text-zinc-100">Friday</h1>
            </button>
            <div className="flex items-center gap-1">
              {onHome && (
                <button
                  onClick={onHome}
                  aria-label="Home"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <Home className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onToggle}
                aria-label="Close sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 md:hidden"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={newSession}
              className="w-full justify-start gap-2 border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>

          <Separator className="bg-zinc-800/60" />

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {state.sessionOrder.length === 0 ? (
              <p className="px-2 text-xs text-zinc-600">No conversations yet</p>
            ) : (
              <div className="space-y-0.5">
                {state.sessionOrder.map((sid) => {
                  const session = state.sessions[sid]
                  if (!session) return null
                  const isActive = sid === state.currentSessionId
                  return (
                    <div key={sid} className="group flex items-center gap-0.5">
                      <button
                        onClick={() => switchSession(sid)}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                          isActive
                            ? 'bg-zinc-800/60 text-zinc-200'
                            : 'text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-400',
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </button>
                      <button
                        onClick={() => deleteSession(sid)}
                        aria-label="Delete conversation"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-800/50 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-auto">
            {currentFiles.length > 0 && (
              <>
                <Separator className="bg-zinc-800/60" />
                <div className="px-4 py-3">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Session Files</p>
                  <div className="space-y-1">
                    {currentFiles.map((fname) => (
                      <div key={fname} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-400">
                        <FileText className="h-3 w-3 shrink-0 text-zinc-500" />
                        <span className="truncate">{fname}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {allFiles.length > 0 && (
              <>
                <Separator className="bg-zinc-800/60" />
                <div className="px-4 py-3">
                  <button
                    onClick={() => setShowAllFiles(!showAllFiles)}
                    className="flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  >
                    All Uploads
                    {showAllFiles ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </button>
                  {showAllFiles && (
                    <div className="mt-2 space-y-1">
                      {allFiles.map((fname) => (
                        <div key={fname} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-400">
                          <FileText className="h-3 w-3 shrink-0 text-zinc-500" />
                          <span className="truncate">{fname}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </aside>

      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Open sidebar"
          className="fixed left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 md:left-3"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      )}
    </>
  )
}
