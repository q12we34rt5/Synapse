import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { QuizCard } from './QuizCard';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';
import type { Question } from '../types';

export const QuizSession: React.FC = () => {
    const { words, selectedCategoryIds, categories, reviews } = useAppStore();
    const [currentWordId, setCurrentWordId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

    const [lastWordId, setLastWordId] = useState<string | null>(null);

    // Softmax-based weighted random selection
    const selectNextWord = () => {
        // Filter enabled words ONLY
        let filteredWords = Object.values(words).filter(w => w.enabled && w.questions?.length > 0);

        // Filter by Category (Multi-select)
        if (!selectedCategoryIds.includes('all')) {
            filteredWords = filteredWords.filter(w =>
                w.categoryIds?.some(cid => selectedCategoryIds.includes(cid))
            );
        }

        let allWordIds = filteredWords.map(w => w.id);

        if (allWordIds.length === 0) return null;

        // Anti-repetition: Filter out the last word if there are other options
        let candidates = allWordIds;
        if (allWordIds.length > 1 && lastWordId) {
            candidates = allWordIds.filter(id => id !== lastWordId);
        }

        // Calculate scores: (ReviewCount - WrongCount)
        // Lower score = Higher priority
        const scores = candidates.map(id => {
            const r = reviews[id];
            return Math.max(0, (r?.reviewCount || 0) - (r?.wrongCount || 0));
        });

        // Softmax Calculation
        // Weight = exp(-score / Temperature)
        // Temperature (T): Lower (0.5) = "Sharper" distribution (Aggressively picks low scores)
        // Higher (2.0) = "Smoother" distribution (More random)
        const T = 0.5;
        const weights = scores.map(score => Math.exp(-score / T));

        // Weighted Random Selection
        const totalWeight = weights.reduce((acc, w) => acc + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < candidates.length; i++) {
            random -= weights[i];
            if (random < 0) {
                return candidates[i];
            }
        }
        return candidates[candidates.length - 1];
    };

    const pickRandomQuestion = (wordId: string) => {
        const word = words[wordId];
        if (!word || !word.questions || word.questions.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * word.questions.length);
        return word.questions[randomIndex];
    };

    const handleNext = () => {
        const nextId = selectNextWord();
        setCurrentWordId(nextId);
        if (nextId) {
            setLastWordId(nextId);
            const nextQuestion = pickRandomQuestion(nextId);
            setCurrentQuestion(nextQuestion);
        } else {
            setCurrentQuestion(null);
        }
    };

    // Initialize first word or re-validate on change
    useEffect(() => {
        // If we don't have a word, OR the current word is disabled/deleted/not in category, pick a new one
        const word = currentWordId ? words[currentWordId] : null;
        let isValid = word && word.enabled;

        if (isValid && !selectedCategoryIds.includes('all')) {
            isValid = word?.categoryIds?.some(cid => selectedCategoryIds.includes(cid)) || false;
        }

        if (!isValid) {
            handleNext();
        }
    }, [words, selectedCategoryIds]); // Re-run when words or category change

    const word = currentWordId ? words[currentWordId] : null;

    // Use existing review or create a default one for display
    const review = currentWordId ? (reviews[currentWordId] || {
        wordId: currentWordId,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        history: [],
        nextReview: Date.now(),
        interval: 0
    }) : null;

    // If no active words
    if (!word || !currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Active Words</p>
                <div className="text-sm mt-2 text-center max-w-md">
                    <p>{selectedCategoryIds.includes('all') ? 'Add some words to start!' : 'No active words in selected categories.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="mb-6 flex justify-between items-center text-slate-400">
                <div className="flex items-center gap-2">
                    <span>Practice Mode</span>
                    {!selectedCategoryIds.includes('all') && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded border border-indigo-500/30">
                            {selectedCategoryIds.length === 1
                                ? categories[selectedCategoryIds[0]]?.name
                                : `${selectedCategoryIds.length} Categories`}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-1 hover:text-white transition-colors text-sm"
                >
                    Skip <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${word.id}-${currentQuestion.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <QuizCard
                        word={word}
                        question={currentQuestion}
                        review={review!}
                        onComplete={handleNext}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
