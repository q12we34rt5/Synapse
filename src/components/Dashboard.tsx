
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, Trash2, Plus, AlertCircle, Clock, Edit, Sparkles, X, RotateCcw, ArrowDownAZ, Calendar, BarChart3, AlertTriangle, Folder, Tag, MinusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { GeminiProvider } from '../services/llm/GeminiProvider';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import type { LLMService } from '../services/llm/LLMService';

export const Dashboard: React.FC = () => {
    const { words, reviews, deleteWord, settings, addToQueue, processingQueue, activeQueue, clearAllWords, toggleWordStatus, deleteQuestion, addQuestion, updateQuestion, resetWordStats, categories, addCategory, deleteCategory, renameCategory, addWordToCategory, removeWordFromCategory, selectedCategoryIds, toggleCategorySelection, moveCategory, categoryOrder } = useAppStore();
    const [batchInput, setBatchInput] = useState('');
    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');

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

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
            setIsCreatingCategory(false);
        }
    };

    const handleRenameCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategoryId && editCategoryName.trim()) {
            renameCategory(editingCategoryId, editCategoryName.trim());
            setEditingCategoryId(null);
        }
    };

    const [sortOption, setSortOption] = useState<'date' | 'alpha' | 'reviews' | 'mistakes'>('date');

    const sortedWords = Object.values(words)
        .filter(word => {
            if (selectedCategoryIds.includes('all')) return true;
            return word.categoryIds?.some(cid => selectedCategoryIds.includes(cid));
        })
        .sort((a, b) => {
            const reviewA = reviews[a.id];
            const reviewB = reviews[b.id];

            switch (sortOption) {
                case 'alpha':
                    return a.original.localeCompare(b.original);
                case 'reviews':
                    return (reviewB?.reviewCount || 0) - (reviewA?.reviewCount || 0);
                case 'mistakes':
                    return (reviewB?.wrongCount || 0) - (reviewA?.wrongCount || 0);
                case 'date':
                default:
                    return b.addedAt - a.addedAt;
            }
        });

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6 relative">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-4">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-indigo-400" />
                        Categories
                    </h2>
                    <div className="space-y-2">
                        <div
                            onClick={() => toggleCategorySelection('all')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group cursor-pointer ${selectedCategoryIds.includes('all') ? 'bg-indigo-900/40 text-indigo-100' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Toggle Switch */}
                                <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${selectedCategoryIds.includes('all') ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${selectedCategoryIds.includes('all') ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span>All Words</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategoryIds.includes('all') ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                {Object.keys(words).length}
                            </span>
                        </div>

                        <div className="my-2 border-t border-slate-700/50"></div>

                        {(categoryOrder || Object.keys(categories)).map((categoryId, index) => {
                            const category = categories[categoryId];
                            if (!category) return null;
                            const isFirst = index === 0;
                            const isLast = index === (categoryOrder || Object.keys(categories)).length - 1;

                            return (
                                <div key={categoryId} className="relative group mb-1">
                                    {editingCategoryId === categoryId ? (
                                        <form onSubmit={handleRenameCategorySubmit} className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editCategoryName}
                                                onChange={e => setEditCategoryName(e.target.value)}
                                                onBlur={() => setEditingCategoryId(null)}
                                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </form>
                                    ) : (
                                        <div
                                            onClick={() => toggleCategorySelection(categoryId)}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group cursor-pointer ${selectedCategoryIds.includes(categoryId) ? 'bg-indigo-900/40 text-indigo-100' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                {/* Toggle Switch */}
                                                <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${selectedCategoryIds.includes(categoryId) ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${selectedCategoryIds.includes(categoryId) ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>

                                                <div className="flex items-center gap-2 truncate">
                                                    <Tag className="w-3 h-3 flex-shrink-0 opacity-70" />
                                                    <span className="truncate">{category.name}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                                                <div className="flex flex-col gap-0.5 mr-2">
                                                    {!isFirst && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                moveCategory(categoryId, 'up');
                                                            }}
                                                            className="p-0.5 hover:text-white text-slate-500"
                                                            title="Move Up"
                                                        >
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    {!isLast && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                moveCategory(categoryId, 'down');
                                                            }}
                                                            className="p-0.5 hover:text-white text-slate-500"
                                                            title="Move Down"
                                                        >
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCategoryId(categoryId);
                                                        setEditCategoryName(category.name);
                                                    }}
                                                    className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
                                                    title="Rename"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete category "${category.name}"? Words will not be deleted.`)) {
                                                            deleteCategory(categoryId);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200"
                                                    title="Delete Category"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isCreatingCategory ? (
                            <form onSubmit={handleCreateCategory} className="mt-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Category Name"
                                    onBlur={() => !newCategoryName && setIsCreatingCategory(false)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-2"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingCategory(false)}
                                        className="text-xs text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="text-xs bg-indigo-600 px-2 py-1 rounded text-white hover:bg-indigo-500"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreatingCategory(true)}
                                className="w-full mt-2 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Category
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-8 min-w-0">
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

                    {/* Sort Controls */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSortOption('date')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${sortOption === 'date' ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <Calendar className="w-4 h-4" />
                            Date
                        </button>
                        <button
                            onClick={() => setSortOption('alpha')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${sortOption === 'alpha' ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <ArrowDownAZ className="w-4 h-4" />
                            A-Z
                        </button>
                        <button
                            onClick={() => setSortOption('reviews')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${sortOption === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Reviews
                        </button>
                        <button
                            onClick={() => setSortOption('mistakes')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${sortOption === 'mistakes' ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Mistakes
                        </button>
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

                                                    <div className="text-center px-2">
                                                        <div className="text-xs text-slate-500 uppercase font-bold">Mistakes</div>
                                                        <div className={`font-mono ${review?.wrongCount ? 'text-red-400' : 'text-slate-500'}`}>
                                                            {review?.wrongCount || 0}
                                                        </div>
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            resetWordStats(word.id);
                                                        }}
                                                        className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                                                        title="Reset Stats"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>

                                                    {(!selectedCategoryIds.includes('all') && selectedCategoryIds.length === 1) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeWordFromCategory(word.id, selectedCategoryIds[0]);
                                                            }}
                                                            className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                                                            title="Remove from category"
                                                        >
                                                            <MinusCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

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
                                                            {/* Category Management */}
                                                            <div className="mb-4 space-y-2 pb-4 border-b border-slate-700/50">
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {word.categoryIds?.map(catId => {
                                                                        const category = categories[catId];
                                                                        if (!category) return null;
                                                                        return (
                                                                            <span key={catId} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs flex items-center gap-1">
                                                                                <Tag className="w-3 h-3" />
                                                                                {category.name}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        removeWordFromCategory(word.id, catId);
                                                                                    }}
                                                                                    className="hover:text-white ml-1"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {(!word.categoryIds || word.categoryIds.length === 0) && (
                                                                        <span className="text-xs text-slate-500 italic">No categories</span>
                                                                    )}
                                                                </div>

                                                                {/* Available Categories */}
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {Object.values(categories)
                                                                        .filter(cat => !word.categoryIds?.includes(cat.id))
                                                                        .map(category => (
                                                                            <button
                                                                                key={category.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    addWordToCategory(word.id, category.id);
                                                                                }}
                                                                                className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs flex items-center gap-1 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                                {category.name}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </div>

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
        </div>
    );
};
