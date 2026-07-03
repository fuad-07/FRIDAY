import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { ChatProvider, useChat } from '@/context/ChatContext'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { ChatWindow } from '@/components/Chat/ChatWindow'
import { HomePage } from '@/components/Home/HomePage'
import { cn } from '@/lib/utils'

function getPath(): 'home' | 'chat' {
  return window.location.pathname === '/chat' ? 'chat' : 'home'
}

function AppContent() {
  const [page, setPage] = useState<'home' | 'chat'>(getPath)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { state } = useChat()

  useEffect(() => {
    const onPop = () => setPage(getPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: 'home' | 'chat') => {
    if (to === page) return
    const url = to === 'chat' ? '/chat' : '/'
    window.history.pushState({}, '', url)
    setPage(to)
  }, [page])

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#050505]" />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {page === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <HomePage onStart={() => navigate('chat')} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex h-dvh text-zinc-100"
            >
              <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} onHome={() => navigate('home')} />
              <main className={cn('flex flex-1 flex-col transition-all duration-300', sidebarOpen ? 'md:ml-0' : '')}>
                <ChatWindow />
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#e4e4e7',
            border: '1px solid #27272a',
            fontSize: '13px',
          },
        }}
      />
    </ChatProvider>
  )
}
