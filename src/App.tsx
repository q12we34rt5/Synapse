import { useState } from 'react';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './components/Dashboard';
import { QuizSession } from './components/QuizSession';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LayoutDashboard, BrainCircuit } from 'lucide-react';

function App() {
  const [view, setView] = useState<'dashboard' | 'quiz'>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 hidden md:block">
            LexiFlow
          </h1>
        </div>

        <nav className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setView('quiz')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'quiz' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
          >
            <BrainCircuit className="w-4 h-4" />
            Practice
          </button>
        </nav>

        <SettingsModal />
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {view === 'dashboard' ? <Dashboard /> : <QuizSession />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
