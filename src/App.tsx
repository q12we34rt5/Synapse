import { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './components/Dashboard';
import { QuizSession } from './components/QuizSession';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LayoutDashboard, BrainCircuit } from 'lucide-react';
import { GeminiProvider } from './services/llm/GeminiProvider';
import { OpenAIProvider } from './services/llm/OpenAIProvider';
import { v4 as uuidv4 } from 'uuid';
import type { LLMService } from './services/llm/LLMService';

function App() {
  const [view, setView] = useState<'dashboard' | 'quiz'>('dashboard');
  const {
    processingQueue,
    activeQueue,
    settings,
    addWord,
    moveToActive,
    completeProcessing,
    selectedCategoryIds
  } = useAppStore();

  // Queue Processing Effect
  useEffect(() => {
    // Determine how many slots are effectively free
    const activeLimit = settings.concurrencyLimit || 1;

    const processWord = async (word: string) => {
      try {
        let llm: LLMService;
        if (settings.provider === 'openai') {
          llm = new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.modelName);
        } else {
          llm = new GeminiProvider(settings.apiKey);
        }

        const data = await llm.generateWordData(word);
        addWord({
          id: uuidv4(),
          ...data,
          categoryIds: selectedCategoryIds.filter(id => id !== 'all'),
          questions: data.questions.map(q => ({ ...q, id: uuidv4() })),
          enabled: true, // Default enabled
          addedAt: Date.now(),
        });
      } catch (error) {
        console.error(`Failed to process word: ${word}`, error);
      } finally {
        // Remove from active queue when done
        completeProcessing(word);

        // We rely on the effect re-running due to activeQueue changing to pick up new work
      }
    };

    // This effect runs whenever processingQueue or activeQueue (or settings) change.
    // We check if we can start more work.

    // We need to loop here because moveToActive is synchronous state update, 
    // but we might need to start multiple items if many slots opened up or we just increased the limit.
    const startNewTasks = () => {
      let currentActiveCount = activeQueue.length;

      while (currentActiveCount < activeLimit && processingQueue.length > 0) {
        // Move item from waiting to active
        const wordToProcess = moveToActive();

        if (wordToProcess) {
          currentActiveCount++; // Locally track to avoid over-scheduling in this synchronous loop
          processWord(wordToProcess);
        } else {
          break;
        }
      }
    };

    startNewTasks();

  }, [processingQueue, activeQueue, settings, addWord, moveToActive, completeProcessing]);

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
            Synapse
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
