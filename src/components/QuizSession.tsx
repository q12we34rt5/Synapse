import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { QuizCard } from './QuizCard';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';

export const QuizSession: React.FC = () => {
    const { words, reviews } = useAppStore();
    const [currentWordId, setCurrentWordId] = useState<string | null>(null);

    const [lastWordId, setLastWordId] = useState<string | null>(null);

    // Softmax-based weighted random selection
    const selectNextWord = () => {
        const allWordIds = Object.keys(words);
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

    // Initialize first word
    useEffect(() => {
        if (!currentWordId) {
            const next = selectNextWord();
            setCurrentWordId(next);
            if (next) setLastWordId(next);
        }
    }, [words]);

    const handleNext = () => {
        const next = selectNextWord();
        setCurrentWordId(next);
        if (next) setLastWordId(next);
    };

    const word = currentWordId ? words[currentWordId] : null;
    const review = currentWordId ? reviews[currentWordId] : null;

    if (!word || !review) {
        return (
            <div className="text-center py-20 text-slate-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-400 mb-2">No Words Found</h2>
                <p>Go to the Dashboard to add some vocabulary first.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="mb-6 flex justify-between items-center text-slate-400">
                <span>Practice Mode</span>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-1 hover:text-white transition-colors text-sm"
                >
                    Skip <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={word.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <QuizCard
                        word={word}
                        review={review}
                        onComplete={handleNext}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
