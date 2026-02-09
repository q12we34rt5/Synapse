import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Word, ReviewItem, Settings, Question, Category } from '../types';
import { DEFAULT_PROMPTS } from '../constants/prompts';

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

    resetWordStats: (wordId: string) => void;

    // Category Actions
    addCategory: (name: string) => void;
    deleteCategory: (id: string) => void;
    renameCategory: (id: string, name: string) => void;
    moveCategory: (id: string, direction: 'up' | 'down') => void;
    addWordToCategory: (wordId: string, categoryId: string) => void;
    removeWordFromCategory: (wordId: string, categoryId: string) => void;

    // Multi-select actions
    toggleCategorySelection: (id: string, isSingleSelect?: boolean) => void;
    setSelectedCategoryIds: (ids: string[]) => void;

    getDueReviews: () => ReviewItem[];
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            words: {},
            categories: {},
            reviews: {},
            settings: {
                apiKey: '',
                provider: 'gemini',
                baseUrl: 'http://localhost:8000/v1',
                modelName: 'meta-llama/Meta-Llama-3-8B-Instruct',
                concurrencyLimit: 1,
                theme: 'dark',
                useCustomPrompts: false,
                prompts: DEFAULT_PROMPTS,
            },
            processingQueue: [], // Initialize empty queue
            activeQueue: [], // Initialize empty active queue
            selectedCategoryIds: ['all'],
            categoryOrder: [],

            addToQueue: (newWords) =>
                set((state) => ({
                    processingQueue: [...state.processingQueue, ...newWords]
                })),

            removeFromQueue: () =>
                set((state) => {
                    const [_, ...rest] = state.processingQueue;
                    return { processingQueue: rest };
                }),

            moveToActive: () => {
                const state = get();
                if (state.processingQueue.length === 0) return null;
                const [first, ...rest] = state.processingQueue;
                set({
                    processingQueue: rest,
                    activeQueue: [...state.activeQueue, first]
                });
                return first;
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
                            reviewCount: 0,
                            correctCount: 0,
                            wrongCount: 0,
                            history: [],
                            nextReview: Date.now(),
                            interval: 0
                        }
                    }
                })),

            deleteWord: (id) =>
                set((state) => {
                    const { [id]: deleted, ...remainingWords } = state.words;
                    const { [id]: deletedReview, ...remainingReviews } = state.reviews;
                    return {
                        words: remainingWords,
                        reviews: remainingReviews
                    };
                }),

            clearAllWords: () =>
                set(() => ({
                    words: {},
                    reviews: {},
                    processingQueue: [],
                    activeQueue: [],
                })),

            updateReview: (review) =>
                set((state) => ({
                    reviews: { ...state.reviews, [review.wordId]: review }
                })),

            setSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings }
                })),

            importData: (data) => set((state) => {
                const newWords = { ...state.words, ...(data.words || {}) };
                const newReviews = { ...state.reviews, ...(data.reviews || {}) };
                const newCategories = { ...state.categories, ...(data.categories || {}) };

                const existingOrder = state.categoryOrder || [];
                const importedOrder = data.categoryOrder || Object.keys(data.categories || {});
                // Filter out duplicates
                const uniqueImported = importedOrder.filter(id => !existingOrder.includes(id));

                return {
                    words: newWords,
                    reviews: newReviews,
                    categories: newCategories,
                    categoryOrder: [...existingOrder, ...uniqueImported],
                    selectedCategoryIds: data.selectedCategoryIds || state.selectedCategoryIds,
                    settings: { ...state.settings, ...(data.settings || {}) }
                };
            }),

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

            resetWordStats: (wordId) =>
                set((state) => {
                    const review = state.reviews[wordId];
                    if (!review) return {};
                    return {
                        reviews: {
                            ...state.reviews,
                            [wordId]: {
                                ...review,
                                reviewCount: 0,
                                wrongCount: 0,
                                nextReview: Date.now(),
                                interval: 0,
                                history: []
                            }
                        }
                    };
                }),

            addCategory: (name) =>
                set((state) => {
                    const id = uuidv4();
                    const newCategory: Category = {
                        id,
                        name,
                        createdAt: Date.now(),
                    };
                    return {
                        categories: { ...state.categories, [id]: newCategory },
                        categoryOrder: [...(state.categoryOrder || []), id]
                    };
                }),

            deleteCategory: (id) =>
                set((state) => {
                    // 1. Remove category from store
                    const { [id]: deleted, ...remainingCategories } = state.categories;

                    // 2. Remove categoryId from all words
                    const newWords = { ...state.words };
                    Object.keys(newWords).forEach(wordId => {
                        const word = newWords[wordId];
                        if (word.categoryIds?.includes(id)) {
                            newWords[wordId] = {
                                ...word,
                                categoryIds: word.categoryIds.filter(cid => cid !== id)
                            };
                        }
                    });

                    // 3. Remove from order
                    const newOrder = (state.categoryOrder || []).filter(cid => cid !== id);

                    // 4. Remove from selection if present
                    const newSelected = state.selectedCategoryIds.filter(cid => cid !== id);
                    const finalSelected = newSelected.length === 0 ? ['all'] : newSelected;

                    return {
                        categories: remainingCategories,
                        words: newWords,
                        selectedCategoryIds: finalSelected,
                        categoryOrder: newOrder
                    };
                }),

            renameCategory: (id, name) =>
                set((state) => {
                    const category = state.categories[id];
                    if (!category) return {};
                    return {
                        categories: {
                            ...state.categories,
                            [id]: { ...category, name }
                        }
                    };
                }),

            moveCategory: (id, direction) =>
                set((state) => {
                    const order = [...(state.categoryOrder || [])];
                    const index = order.indexOf(id);
                    if (index === -1) return {};

                    if (direction === 'up') {
                        if (index === 0) return {}; // Already at top
                        [order[index - 1], order[index]] = [order[index], order[index - 1]];
                    } else {
                        if (index === order.length - 1) return {}; // Already at bottom
                        [order[index + 1], order[index]] = [order[index], order[index + 1]];
                    }

                    return { categoryOrder: order };
                }),

            addWordToCategory: (wordId, categoryId) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    const currentCategories = word.categoryIds || [];
                    if (currentCategories.includes(categoryId)) return {};
                    return {
                        words: {
                            ...state.words,
                            [wordId]: {
                                ...word,
                                categoryIds: [...currentCategories, categoryId]
                            }
                        }
                    };
                }),

            removeWordFromCategory: (wordId, categoryId) =>
                set((state) => {
                    const word = state.words[wordId];
                    if (!word) return {};
                    const currentCategories = word.categoryIds || [];
                    return {
                        words: {
                            ...state.words,
                            [wordId]: {
                                ...word,
                                categoryIds: currentCategories.filter(cid => cid !== categoryId)
                            }
                        }
                    };
                }),

            setSelectedCategoryIds: (ids) => set({ selectedCategoryIds: ids }),

            toggleCategorySelection: (id, isSingleSelect) => set((state) => {
                const current = state.selectedCategoryIds;

                // Single Select Mode (Clicking the name)
                if (isSingleSelect) {
                    // If clicking "all", or clicking the same single category -> set to that
                    if (id === 'all') return { selectedCategoryIds: ['all'] };
                    return { selectedCategoryIds: [id] };
                }

                // Toggle Mode (Checkbox)
                // If "all" is currently selected, clear it when selecting specific
                let newSelection = current.includes('all') ? [] : [...current];

                if (id === 'all') {
                    // Toggling "All" -> If it was on, turn off (but must have at least one? No via UI usually "All" is distinct).
                    // Actually, if I toggle "All", it should just be "All".
                    return { selectedCategoryIds: ['all'] };
                }

                if (newSelection.includes(id)) {
                    newSelection = newSelection.filter(cid => cid !== id);
                } else {
                    newSelection.push(id);
                }

                // If nothing selected, fallback to All? Or allow empty? 
                // Usually dashboard with empty filter shows nothing. 
                // But generally "No Filter" = "All". 
                // Let's fallback to 'all' if empty.
                if (newSelection.length === 0) {
                    return { selectedCategoryIds: ['all'] };
                }

                return { selectedCategoryIds: newSelection };
            }),

            getDueReviews: () => {
                const now = Date.now();
                const { reviews } = get();
                return Object.values(reviews).filter(r => r.nextReview <= now);
            }

        }),
        {
            name: 'synapse-storage-v2',
            version: 4, // Bump for categoryOrder migration
            migrate: (persistedState: any, version: number) => {
                let state = persistedState as any;

                // Unified migration for all previous versions to v4
                if (version < 4) {
                    const words = state.words || {};
                    const categories = state.categories || {};

                    // 1. Sanitize Words
                    Object.keys(words).forEach((key) => {
                        const word = words[key];
                        // Fix legacy questions
                        if (!word.questions) {
                            word.questions = [{
                                id: uuidv4(),
                                sentence: word.sentence || '',
                                translation: word.translation || '',
                                cloze: word.cloze || word.sentence || '',
                            }];
                            delete word.sentence;
                            delete word.translation;
                            delete word.cloze;
                        }
                        // Ensure categoryIds
                        if (!word.categoryIds) {
                            word.categoryIds = [];
                        }
                    });

                    // 2. Migrate Selection (String -> Array)
                    let newSelectedIds = state.selectedCategoryIds;
                    if (!Array.isArray(newSelectedIds)) {
                        const old = state.selectedCategoryId;
                        newSelectedIds = old ? [old] : ['all'];
                    }

                    // 3. Initialize categoryOrder if missing
                    let newOrder = state.categoryOrder;
                    if (!Array.isArray(newOrder)) {
                        newOrder = Object.keys(categories);
                    }

                    return {
                        ...state,
                        words,
                        categories,
                        selectedCategoryIds: newSelectedIds,
                        categoryOrder: newOrder,
                        selectedCategoryId: undefined // Clean up
                    };
                }
                return state as AppStore;
            },
        }
    )
);
