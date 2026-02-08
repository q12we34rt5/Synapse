

export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    type: 'CORRECT' | 'TYPO' | 'WRONG_MEANING' | 'UNRELATED' | 'CLOSE_SYNONYM';
}

export interface LLMService {
    generateWordData(word: string): Promise<{
        original: string;
        wordTranslation: string;
        questions: {
            sentence: string;
            translation: string;
            cloze: string;
        }[];
    }>;
    evaluateAnswer(targetWord: string, userInput: string, sentence: string): Promise<EvaluationResult>;
    generateQuestion(word: string): Promise<{
        sentence: string;
        translation: string;
        cloze: string;
    }>;
}
