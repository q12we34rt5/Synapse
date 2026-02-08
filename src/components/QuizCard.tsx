import React, { useState, useEffect } from 'react';
import type { Word, ReviewItem, Question } from '../types';
import { useAppStore } from '../store/useAppStore';
import { GeminiProvider } from '../services/llm/GeminiProvider';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import { calculateNextReview } from '../utils/srs';
import { motion } from 'framer-motion';
import { HelpCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { EvaluationResult, LLMService } from '../services/llm/LLMService';

interface QuizCardProps {
    word: Word;
    question: Question;
    review: ReviewItem;
    onComplete: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ word, question, review, onComplete }) => {
    const { settings, updateReview } = useAppStore();

    const [input, setInput] = useState('');
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [feedback, setFeedback] = useState<EvaluationResult | null>(null);

    // Reset state when word/question changes
    useEffect(() => {
        setInput('');
        setHintsUsed(0);
        setShowAnswer(false);
        setIsEvaluating(false);
        setFeedback(null);
    }, [word.id, question.id]);

    const handleHint = () => {
        if (hintsUsed < 3) {
            setHintsUsed(prev => prev + 1);
        }
    };

    const getHintText = () => {
        if (hintsUsed === 0) return '';
        if (hintsUsed === 1) return word.original.charAt(0) + '...';
        if (hintsUsed === 2) return word.original.substring(0, 2) + '...';
        return word.original.substring(0, Math.ceil(word.original.length / 2)) + '...';
    };

    const handleGiveUp = () => {
        setShowAnswer(true);
        const nextReview = calculateNextReview(review, 'WRONG_GIVE_UP');
        updateReview(nextReview);
        // Don't call onComplete immediately, let user see the answer
    };

    const checkAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isEvaluating) return;

        setIsEvaluating(true);
        try {
            let llm: LLMService;
            if (settings.provider === 'openai') {
                llm = new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.modelName);
            } else {
                llm = new GeminiProvider(settings.apiKey);
            }

            const result = await llm.evaluateAnswer(word.original, input, question.sentence);
            setFeedback(result);

            if (result.isCorrect) {
                const outcome = hintsUsed > 0 ? 'CORRECT_AFTER_HINT' : 'CORRECT_IMMEDIATE';
                const nextReview = calculateNextReview(review, outcome);
                updateReview(nextReview);
                // Wait a bit before moving to next card
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }
        } catch (error) {
            console.error(error);
            alert('Error checking answer. Check API Key.');
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl"
            >
                {!showAnswer && !feedback?.isCorrect ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-xl text-slate-400 mb-2">Fill in the blank</h2>
                            <p className="text-2xl md:text-3xl font-medium leading-relaxed text-indigo-100">
                                {question.cloze.split('__________').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className="inline-block min-w-[100px] border-b-2 border-indigo-500 mx-2 text-center text-indigo-300 font-bold">
                                                {input || (getHintText() || '______')}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </p>
                            {question.translation && (
                                <p className="mt-4 text-slate-500 text-lg">{question.translation}</p>
                            )}
                        </div>

                        <form onSubmit={checkAnswer} className="space-y-6">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                autoFocus
                            />

                            <div className="flex gap-4 justify-between">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleHint}
                                        disabled={hintsUsed >= 3}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors flex items-center gap-2"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Hint ({3 - hintsUsed})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGiveUp}
                                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg transition-colors border border-red-900/50"
                                    >
                                        Give Up
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isEvaluating || !input}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    {isEvaluating ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Check'}
                                </button>
                            </div>
                        </form>

                        {feedback && !feedback.isCorrect && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl text-amber-200"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <p className="font-bold mb-1">{feedback.type}</p>
                                        <p>{feedback.feedback}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="mb-6 flex justify-center">
                            {feedback?.isCorrect ? (
                                <CheckCircle className="w-20 h-20 text-green-500" />
                            ) : (
                                <XCircle className="w-20 h-20 text-red-500" />
                            )}
                        </div>

                        <h3 className="text-3xl font-bold text-white mb-2">{word.original}</h3>
                        <p className="text-xl text-slate-400 mb-6">{word.wordTranslation}</p>

                        <div className="bg-slate-900/50 p-6 rounded-xl mb-8 text-left">
                            <p className="text-indigo-200 text-lg mb-2">{question.sentence}</p>
                            <p className="text-slate-500">{question.translation}</p>
                        </div>

                        <button
                            onClick={onComplete}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all w-full md:w-auto"
                        >
                            Next Word
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
