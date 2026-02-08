import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { LLMService, EvaluationResult } from "./LLMService";
import { DEFAULT_PROMPTS } from "../../constants/prompts";


export class GeminiProvider implements LLMService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private prompts?: {
        generateData: string;
        generateQuestion: string;
        evaluateAnswer: string;
    };

    constructor(apiKey: string, prompts?: { generateData: string; generateQuestion: string; evaluateAnswer: string }) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.prompts = prompts;
    }

    async generateWordData(word: string): Promise<{
        original: string;
        wordTranslation: string;
        questions: {
            sentence: string;
            translation: string;
            cloze: string;
        }[];
    }> {
        const prompt = this.prompts?.generateData
            ? this.prompts.generateData.replace(/\${word}/g, word)
            : DEFAULT_PROMPTS.generateData.replace(/\${word}/g, word);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            return {
                original: data.original,
                wordTranslation: data.wordTranslation,
                questions: [{
                    sentence: data.sentence,
                    translation: data.translation,
                    cloze: data.cloze
                }]
            };
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw new Error("Failed to generate word data.");
        }
    }

    async generateQuestion(word: string): Promise<{
        sentence: string;
        translation: string;
        cloze: string;
    }> {
        const prompt = this.prompts?.generateQuestion
            ? this.prompts.generateQuestion.replace(/\${word}/g, word)
            : DEFAULT_PROMPTS.generateQuestion.replace(/\${word}/g, word);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            return {
                sentence: data.sentence,
                translation: data.translation,
                cloze: data.cloze
            };
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            throw new Error("Failed to generate question.");
        }
    }

    async evaluateAnswer(targetWord: string, userInput: string, sentence: string): Promise<EvaluationResult> {
        const prompt = this.prompts?.evaluateAnswer
            ? this.prompts.evaluateAnswer
                .replace(/\${targetWord}/g, targetWord)
                .replace(/\${userInput}/g, userInput)
                .replace(/\${sentence}/g, sentence)
            : DEFAULT_PROMPTS.evaluateAnswer
                .replace(/\${targetWord}/g, targetWord)
                .replace(/\${userInput}/g, userInput)
                .replace(/\${sentence}/g, sentence);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error("Gemini Evaluation Error:", error);
            throw new Error("Failed to evaluate answer.");
        }
    }
}
