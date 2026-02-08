import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Word, ReviewItem, Settings } from '../types';

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
                    activeQueue: [], // Reset active queue on import (or we could try to preserve it, but safe to reset)
                })),
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
        }
    )
);
