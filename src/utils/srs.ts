import type { ReviewItem } from '../types';

export const calculateNextReview = (
    item: ReviewItem,
    outcome: 'CORRECT_IMMEDIATE' | 'CORRECT_AFTER_HINT' | 'WRONG_GIVE_UP'
): ReviewItem => {
    const now = Date.now();
    let nextInterval = 0; // minutes

    // Simple logic as requested:
    // - Correct: 30 mins (if it was 0, otherwise double?) - User requested specific:
    //   "如果幾乎拼對了... 30分鐘後複習" -> CORRECT_IMMEDIATE
    //   "如果用了幾次提示... 10分鐘後複習" -> CORRECT_AFTER_HINT
    //   "如果完全答不出來... 5分鐘後複習" -> WRONG_GIVE_UP

    // Note: For a real SRS, we'd want exponential growth, but for this prototype 
    // we will follow the user's explicit instructions for the *immediate* next step.
    // We can add a multiplier for subsequent reviews if they keep getting it right.

    switch (outcome) {
        case 'CORRECT_IMMEDIATE':
            // If they already know it well (interval > 30), we can double it.
            // But the prompt says "30 mins", so we'll stick to at least 30m.
            nextInterval = Math.max(30, item.interval * 2);
            break;
        case 'CORRECT_AFTER_HINT':
            nextInterval = 10;
            break;
        case 'WRONG_GIVE_UP':
            nextInterval = 5;
            break;
    }

    return {
        ...item,
        interval: nextInterval,
        nextReview: now + nextInterval * 60 * 1000,
        reviewCount: (item.reviewCount || 0) + 1,
        wrongCount: outcome === 'WRONG_GIVE_UP' ? (item.wrongCount || 0) + 1 : (item.wrongCount || 0),
        history: [
            ...item.history,
            { date: now, outcome },
        ],
    };
};
