
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, Trash2, Plus, AlertCircle, Clock, Edit, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { GeminiProvider } from '../services/llm/GeminiProvider';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import type { LLMService } from '../services/llm/LLMService';

export const Dashboard: React.FC = () => {
    const { words, reviews, deleteWord, settings, addToQueue, processingQueue, activeQueue, clearAllWords, toggleWordStatus, deleteQuestion, addQuestion, updateQuestion } = useAppStore();
    const [batchInput, setBatchInput] = useState('');
    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

    // Question Management State
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [targetWordId, setTargetWordId] = useState<string | null>(null);
    const [questionForm, setQuestionForm] = useState({ sentence: '', translation: '', cloze: '' });
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // wordId being generated

    const handleBatchSubmit = () => {
        if (!batchInput.trim()) return;

        // Validation
        if (settings.provider === 'gemini' && !settings.apiKey) {
            alert('Please configure your Gemini API Key in settings.');
            return;
        }

        const lines = batchInput.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        addToQueue(lines);
        setBatchInput('');
    };

    const handleGenerateQuestion = async (wordId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const word = words[wordId];
        if (!word) return;

        if (settings.provider === 'gemini' && !settings.apiKey) {
            alert('Please configure your Gemini API Key in settings.');
            return;
        }

        setIsGenerating(wordId);
        try {
            let llm: LLMService;
            if (settings.provider === 'openai') {
                llm = new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.modelName, settings.prompts);
            } else {
                llm = new GeminiProvider(settings.apiKey, settings.prompts);
            }

            const data = await llm.generateQuestion(word.original);

            addQuestion(wordId, {
                id: uuidv4(),
                ...data
            });
        } catch (error) {
            console.error(error);
            alert('Failed to generate question.');
        } finally {
            setIsGenerating(null);
        }
    };

    const openAddQuestionModal = (wordId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetWordId(wordId);
        setEditingQuestionId(null);
        setQuestionForm({ sentence: '', translation: '', cloze: '' });
        setIsQuestionModalOpen(true);
    };

    const openEditQuestionModal = (wordId: string, questionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const word = words[wordId];
        const question = word?.questions.find(q => q.id === questionId);
        if (!word || !question) return;

        setTargetWordId(wordId);
        setEditingQuestionId(questionId);
        setQuestionForm({
            sentence: question.sentence,
            translation: question.translation,
            cloze: question.cloze
        });
        setIsQuestionModalOpen(true);
    };

    const handleSaveQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetWordId) return;

        if (editingQuestionId) {
            updateQuestion(targetWordId, editingQuestionId, questionForm);
        } else {
            addQuestion(targetWordId, {
                id: uuidv4(),
                ...questionForm
            });
        }
        setIsQuestionModalOpen(false);
    };

    const sortedWords = Object.values(words).sort((a, b) => b.addedAt - a.addedAt);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8 relative">
            {/* Question Modal */}
            <AnimatePresence>
                {isQuestionModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsQuestionModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                                </h3>
                                <button onClick={() => setIsQuestionModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveQuestion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Sentence</label>
                                    <input
                                        type="text"
                                        required
                                        value={questionForm.sentence}
                                        onChange={e => setQuestionForm({ ...questionForm, sentence: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Example sentence..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Translation</label>
                                    <input
                                        type="text"
                                        required
                                        value={questionForm.translation}
                                        onChange={e => setQuestionForm({ ...questionForm, translation: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Chinese translation..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Cloze (use __________ for blank)</label>
                                    <input
                                        type="text"
                                        required
                                        value={questionForm.cloze}
                                        onChange={e => setQuestionForm({ ...questionForm, cloze: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Sentence with __________"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsQuestionModalOpen(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                                    >
                                        Save Question
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Batch Input Section */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    Add Words
                </h2>
                <div className="space-y-4">
                    <textarea
                        value={batchInput}
                        onChange={(e) => setBatchInput(e.target.value)}
                        placeholder="Enter words here, one per line..."
                        className="w-full h-32 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            Tip: You can paste a list of words.
                        </span>
                        <button
                            onClick={handleBatchSubmit}
                            disabled={!batchInput.trim()}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add to Queue
                        </button>
                    </div>

                    {/* Processing Queue Display */}
                    <AnimatePresence>
                        {(processingQueue.length > 0 || activeQueue.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-900/50 rounded-xl p-4 border border-indigo-500/30 space-y-3"
                            >
                                {/* Active Processing */}
                                {activeQueue.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm font-medium">Processing ({activeQueue.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {activeQueue.map((word, index) => (
                                                <div key={`active-${word} -${index} `} className="px-3 py-1 bg-indigo-500/20 text-indigo-200 rounded-full text-xs flex items-center gap-2 border border-indigo-500/20 animate-pulse">
                                                    {word}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Queue */}
                                {processingQueue.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm font-medium">Pending ({processingQueue.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {processingQueue.slice(0, 10).map((word, index) => (
                                                <div key={`pending-${word} -${index} `} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs border border-slate-700">
                                                    {word}
                                                </div>
                                            ))}
                                            {processingQueue.length > 10 && (
                                                <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs border border-slate-700">
                                                    +{processingQueue.length - 10} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Word List */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Vocabulary List ({sortedWords.length})</h2>
                    {sortedWords.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete ALL words? This action cannot be undone.')) {
                                    clearAllWords();
                                }
                            }}
                            className="text-xs px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                        >
                            Clear All Words
                        </button>
                    )}
                </div>

                {sortedWords.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No words added yet. Add some words above to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {sortedWords.map(word => {
                                const review = reviews[word.id];
                                const isExpanded = expandedWordId === word.id;
                                const isWordGenerating = isGenerating === word.id;

                                return (
                                    <motion.div
                                        key={word.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`border border-slate-700 rounded-xl overflow-hidden transition-colors ${isExpanded ? 'bg-slate-800' : 'bg-slate-800/30 hover:bg-slate-800/50'
                                            } `}
                                    >
                                        <div
                                            className="p-4 flex items-center gap-4 cursor-pointer"
                                            onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className={`font-bold text-lg ${word.enabled ? 'text-white' : 'text-slate-500 line-through'} `}>
                                                        {word.original}
                                                    </h3>
                                                    <span className="text-sm text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                                                        {word.wordTranslation}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                                <div className="text-center px-4">
                                                    <div className="text-xs text-slate-500 uppercase font-bold">Reviews</div>
                                                    <div className="text-indigo-400 font-mono">{review?.reviewCount || 0}</div>
                                                </div>

                                                <label className="flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={word.enabled}
                                                            onChange={() => toggleWordStatus(word.id)}
                                                        />
                                                        <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${word.enabled ? 'bg-indigo-600' : 'bg-slate-600'} `}></div>
                                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${word.enabled ? 'translate-x-4' : 'translate-x-0'} `}></div>
                                                    </div>
                                                </label>

                                                <button
                                                    onClick={() => deleteWord(word.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Delete word"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-slate-700 bg-slate-900/30"
                                                >
                                                    <div className="p-4 space-y-3">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                Questions ({word.questions?.length || 0})
                                                            </h4>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => handleGenerateQuestion(word.id, e)}
                                                                    disabled={isWordGenerating}
                                                                    className="px-3 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                >
                                                                    {isWordGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                    AI Generate
                                                                </button>
                                                                <button
                                                                    onClick={(e) => openAddQuestionModal(word.id, e)}
                                                                    className="px-3 py-1 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add Manually
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {word.questions?.map((q, idx) => (
                                                            <div key={q.id || idx} className="flex gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 group">
                                                                <div className="flex-1 space-y-1">
                                                                    <p className="text-slate-300 text-sm">{q.sentence}</p>
                                                                    <p className="text-slate-500 text-xs italic">{q.translation}</p>
                                                                </div>
                                                                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => openEditQuestionModal(word.id, q.id, e)}
                                                                        className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                                                                    >
                                                                        <Edit className="w-3 h-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (window.confirm('Delete this question?')) {
                                                                                deleteQuestion(word.id, q.id);
                                                                            }
                                                                        }}
                                                                        disabled={word.questions.length <= 1}
                                                                        className="text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-600 p-1 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
