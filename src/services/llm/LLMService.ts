import type { Word } from "../../types";

export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    type: 'CORRECT' | 'TYPO' | 'WRONG_MEANING' | 'UNRELATED' | 'CLOSE_SYNONYM';
}

export interface LLMService {
    generateWordData(word: string): Promise<Omit<Word, 'id' | 'addedAt'>>;
    evaluateAnswer(targetWord: string, userInput: string, sentence: string): Promise<EvaluationResult>;
}
