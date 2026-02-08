import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, Trash2, Plus, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard: React.FC = () => {
    const { words, reviews, deleteWord, settings, addToQueue, processingQueue, activeQueue, clearAllWords } = useAppStore();
    const [batchInput, setBatchInput] = useState('');

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

    const sortedWords = Object.values(words).sort((a, b) => b.addedAt - a.addedAt);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
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
                                                <div key={`active-${word}-${index}`} className="px-3 py-1 bg-indigo-500/20 text-indigo-200 rounded-full text-xs flex items-center gap-2 border border-indigo-500/20 animate-pulse">
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
                                                <div key={`pending-${word}-${index}`} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs border border-slate-700">
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-700">
                                    <th className="p-4 font-normal">Word</th>
                                    <th className="p-4 font-normal">Meaning</th>
                                    <th className="p-4 font-normal text-center">Reviews</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence initial={false}>
                                    {sortedWords.map(word => {
                                        const review = reviews[word.id];
                                        return (
                                            <motion.tr
                                                key={word.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-b border-slate-700/50 hover:bg-slate-700/20 group"
                                            >
                                                <td className="p-4 font-medium text-white">{word.original}</td>
                                                <td className="p-4 text-slate-300">{word.wordTranslation}</td>
                                                <td className="p-4 text-slate-400 text-center">
                                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                                                        {review?.reviewCount || 0}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => deleteWord(word.id)}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete word"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
