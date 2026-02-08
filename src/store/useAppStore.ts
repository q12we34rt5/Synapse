import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Word, ReviewItem, Settings, Question } from '../types';

interface AppStore extends AppState {
    addWord: (word: Word) => void;
    deleteWord: (id: string) => void;
    updateReview: (review: ReviewItem) => void;
    setSettings: (settings: Partial<Settings>) => void;
    importData: (data: Partial<AppState>) => void;
    addToQueue: (words: string[]) => void;
    removeFromQueue: () => void; // Removes the first item
    moveToActive: () => string | null; // Moves first item from processing to active, returns item
    completeProcessing: (word: string) => void; // Removes item from active
    clearAllWords: () => void;

    // New Actions
    toggleWordStatus: (wordId: string) => void;
    addQuestion: (wordId: string, question: Question) => void;
    updateQuestion: (wordId: string, questionId: string, updates: Partial<Question>) => void;
    deleteQuestion: (wordId: string, questionId: string) => void;

    getDueReviews: () => ReviewItem[];
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            words: {},
            reviews: {},
            settings: {
                apiKey: '',
                provider: 'gemini',
                baseUrl: 'http://localhost:8000/v1',
                modelName: 'meta-llama/Meta-Llama-3-8B-Instruct',
                concurrencyLimit: 1,
                theme: 'dark',
            },
            processingQueue: [], // Initialize empty queue
            activeQueue: [], // Initialize empty active queue

            addToQueue: (newWords) =>
                set((state) => ({
                    processingQueue: [...state.processingQueue, ...newWords]
                })),
            removeFromQueue: () =>
                set((state) => ({
                    processingQueue: state.processingQueue.slice(1)
                })),
            moveToActive: () => {
                let movedItem: string | null = null;
                set((state) => {
                    if (state.processingQueue.length === 0) return {};
                    movedItem = state.processingQueue[0];
                    return {
                        processingQueue: state.processingQueue.slice(1),
                        activeQueue: [...state.activeQueue, movedItem]
                    };
                });
                return movedItem;
            },
            completeProcessing: (word) =>
                set((state) => ({
                    activeQueue: state.activeQueue.filter(w => w !== word)
                })),

            addWord: (word) =>
                set((state) => ({
                    words: { ...state.words, [word.id]: word },
                    reviews: {
                        ...state.reviews,
                        [word.id]: {
                            wordId: word.id,
                            nextReview: Date.now(), // Due immediately
                            interval: 0,
                            reviewCount: 0,
                            wrongCount: 0,
                            history: [],
                        },
                    },
                })),

            deleteWord: (id) =>
                set((state) => {
                    const newWords = { ...state.words };
                    const newReviews = { ...state.reviews };
                    delete newWords[id];
                    delete newReviews[id];
                    return { words: newWords, reviews: newReviews };
                }),

            clearAllWords: () =>
                set(() => ({
                    words: {},
                    reviews: {},
                    processingQueue: [],
                    activeQueue: []
                })),

            updateReview: (review) =>
                set((state) => ({
                    reviews: { ...state.reviews, [review.wordId]: review },
                })),

            setSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            importData: (data) =>
                set((state) => ({
                    words: { ...state.words, ...data.words },
                    reviews: { ...state.reviews, ...data.reviews },
                    settings: { ...state.settings, ...data.settings },
                    processingQueue: data.processingQueue || [],
                    activeQueue: [], // Reset active queue on import
                })),

            toggleWordStatus: (wordId) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    return {
                        words: {
                            ...state.words,
                            [wordId]: { ...word, enabled: !word.enabled }
                        }
                    };
                }),

            addQuestion: (wordId, question) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    return {
                        words: {
                            ...state.words,
                            [wordId]: {
                                ...word,
                                questions: [...word.questions, question]
                            }
                        }
                    };
                }),

            updateQuestion: (wordId, questionId, updates) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    return {
                        words: {
                            ...state.words,
                            [wordId]: {
                                ...word,
                                questions: word.questions.map(q =>
                                    q.id === questionId ? { ...q, ...updates } : q
                                )
                            }
                        }
                    };
                }),

            deleteQuestion: (wordId, questionId) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    // Prevent deleting the last question? Maybe allow but warn in UI.
                    return {
                        words: {
                            ...state.words,
                            [wordId]: {
                                ...word,
                                questions: word.questions.filter(q => q.id !== questionId)
                            }
                        }
                    };
                }),

            getDueReviews: () => {
                const now = Date.now();
                const { reviews } = get();
                return Object.values(reviews)
                    .filter((review) => review.nextReview <= now)
                    .sort((a, b) => a.nextReview - b.nextReview);
            },
        }),
        {
            name: 'english-learning-storage',
            version: 1, // Bump version for migration
            migrate: (persistedState: any, version) => {
                if (version === 0) {
                    // Migration from version 0 to 1
                    const newWords = { ...persistedState.words };
                    Object.keys(newWords).forEach((key) => {
                        const word = newWords[key];
                        // Check if it's the old format (no questions array)
                        if (!word.questions) {
                            word.questions = [{
                                id: uuidv4(),
                                sentence: word.sentence || '',
                                translation: word.translation || '',
                                cloze: word.cloze || '',
                            }];
                            word.enabled = true;
                            // Clean up old fields
                            delete word.sentence;
                            delete word.translation;
                            delete word.cloze;
                        }
                    });
                    return { ...persistedState, words: newWords };
                }
                return persistedState;
            },
        }
    )
);
