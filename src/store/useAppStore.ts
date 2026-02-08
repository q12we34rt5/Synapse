import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Word, ReviewItem, Settings } from '../types';

interface AppStore extends AppState {
    addWord: (word: Word) => void;
    deleteWord: (id: string) => void;
    updateReview: (review: ReviewItem) => void;
    setSettings: (settings: Partial<Settings>) => void;
    importData: (data: Partial<AppState>) => void;
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
                theme: 'dark',
            },
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
