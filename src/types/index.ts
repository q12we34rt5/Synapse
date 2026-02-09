export interface Question {
    id: string;
    sentence: string;
    translation: string;
    cloze: string;
}

export interface Word {
    id: string;
    original: string;
    questions: Question[];
    wordTranslation: string; // Word meaning
    enabled: boolean;
    addedAt: number;
    categoryIds: string[];
}

export interface Category {
    id: string;
    name: string;
    createdAt: number;
}

export interface ReviewItem {
    wordId: string;
    nextReview: number; // Timestamp
    interval: number; // Current interval in minutes
    reviewCount: number; // Total number of times reviewed
    wrongCount?: number; // Total number of wrong answers
    history: {
        date: number;
        outcome: 'CORRECT_IMMEDIATE' | 'CORRECT_AFTER_HINT' | 'WRONG_GIVE_UP';
    }[];
}

export interface Settings {
    apiKey: string;
    provider: 'gemini' | 'openai';
    baseUrl?: string; // For local/custom providers
    modelName?: string; // For local/custom providers
    concurrencyLimit?: number; // Max parallel requests
    useCustomPrompts?: boolean;
    theme: 'light' | 'dark' | 'system';
    prompts?: {
        generateData: string;
        generateQuestion: string;
        evaluateAnswer: string;
    };
}

export interface AppState {
    words: Record<string, Word>;
    categories: Record<string, Category>;
    reviews: Record<string, ReviewItem>;
    settings: Settings;
    processingQueue: string[]; // Waiting to be processed
    activeQueue: string[]; // Currently being processed
    selectedCategoryIds: string[]; // Current filter for Dashboard & Quiz (Multi-select)
    categoryOrder: string[]; // Order of category IDs for display
}
