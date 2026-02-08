import OpenAI from 'openai';
import type { LLMService, EvaluationResult } from "./LLMService";
import { DEFAULT_PROMPTS } from "../../constants/prompts";


export class OpenAIProvider implements LLMService {
    private openai: OpenAI;
    private modelName: string;
    private prompts?: {
        generateData: string;
        generateQuestion: string;
        evaluateAnswer: string;
    };

    constructor(apiKey: string, baseUrl?: string, modelName?: string, prompts?: { generateData: string; generateQuestion: string; evaluateAnswer: string }) {
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key', // vLLM/Local often doesn't need a real key, but SDK requires one
            baseURL: baseUrl || 'http://localhost:8000/v1',
            dangerouslyAllowBrowser: true // Required for client-side use
        });
        this.modelName = modelName || 'meta-llama/Meta-Llama-3-8B-Instruct';
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
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.modelName,
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content received from LLM");

            const data = JSON.parse(content);
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
            console.error("OpenAI/Local Generation Error:", error);
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
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.modelName,
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content received from LLM");

            const data = JSON.parse(content);
            return {
                sentence: data.sentence,
                translation: data.translation,
                cloze: data.cloze
            };
        } catch (error) {
            console.error("OpenAI/Local Generation Error:", error);
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
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.modelName,
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content received from LLM");

            return JSON.parse(content);
        } catch (error) {
            console.error("OpenAI/Local Evaluation Error:", error);
            throw new Error("Failed to evaluate answer.");
        }
    }
}
