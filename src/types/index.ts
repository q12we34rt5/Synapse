export interface Word {
    id: string;
    original: string;
    sentence: string;
    translation: string; // Sentence translation
    wordTranslation: string; // Word meaning
    cloze: string; // Sentence with the word replaced by underscores
    addedAt: number;
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
    theme: 'light' | 'dark' | 'system';
}

export interface AppState {
    words: Record<string, Word>;
    reviews: Record<string, ReviewItem>;
    settings: Settings;
    processingQueue: string[];
}
