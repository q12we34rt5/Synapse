import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GeminiProvider } from '../services/llm/GeminiProvider';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import { Loader2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { LLMService } from '../services/llm/LLMService';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard: React.FC = () => {
    const { words, reviews, addWord, deleteWord, settings } = useAppStore();
    const [batchInput, setBatchInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    const handleBatchSubmit = async () => {
        if (!batchInput.trim()) return;

        // Validation
        if (settings.provider === 'gemini' && !settings.apiKey) {
            alert('Please configure your Gemini API Key in settings.');
            return;
        }

        const lines = batchInput.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        setIsProcessing(true);
        setProgress({ current: 0, total: lines.length });

        try {
            let llm: LLMService;
            if (settings.provider === 'openai') {
                llm = new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.modelName);
            } else {
                llm = new GeminiProvider(settings.apiKey);
            }

            for (let i = 0; i < lines.length; i++) {
                const word = lines[i].trim();
                try {
                    const data = await llm.generateWordData(word);
                    addWord({
                        id: uuidv4(),
                        ...data,
                        addedAt: Date.now(),
                    });
                } catch (err) {
                    console.error(`Failed to process word: ${word}`, err);
                }
                setProgress({ current: i + 1, total: lines.length });
            }
            setBatchInput('');
        } catch (error) {
            console.error(error);
            alert('Batch processing failed. check console and API settings.');
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
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
                        disabled={isProcessing}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            {isProcessing && progress ?
                                `Processing ${progress.current}/${progress.total}...` :
                                'Tip: You can paste a list of words.'}
                        </span>
                        <button
                            onClick={handleBatchSubmit}
                            disabled={isProcessing || !batchInput.trim()}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Words'}
                        </button>
                    </div>
                    {isProcessing && progress && (
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Word List */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Vocabulary List ({sortedWords.length})</h2>

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
