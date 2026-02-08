import OpenAI from 'openai';
import type { LLMService, EvaluationResult } from "./LLMService";
import type { Word } from "../../types";

export class OpenAIProvider implements LLMService {
    private openai: OpenAI;
    private modelName: string;

    constructor(apiKey: string, baseUrl?: string, modelName?: string) {
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key', // vLLM/Local often doesn't need a real key, but SDK requires one
            baseURL: baseUrl || 'http://localhost:8000/v1',
            dangerouslyAllowBrowser: true // Required for client-side use
        });
        this.modelName = modelName || 'meta-llama/Meta-Llama-3-8B-Instruct';
    }

    async generateWordData(word: string): Promise<Omit<Word, 'id' | 'addedAt'>> {
        const prompt = `
      Generate a sentence using the English word "${word}". 
      The sentence should be suitable for an intermediate English learner. 
      Return a JSON object ONLY, without markdown formatting, with the following structure:
      {
        "original": "${word}",
        "sentence": "The full sentence containing the word.",
        "translation": "Traditional Chinese translation of the sentence.",
        "wordTranslation": "Traditional Chinese translation of the word '${word}'",
        "cloze": "The sentence with the word '${word}' (and its variations like plurals/tenses if applicable) replaced by '__________'."
      }
    `;

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
            console.error("OpenAI/Local Generation Error:", error);
            throw new Error("Failed to generate word data.");
        }
    }

    async evaluateAnswer(targetWord: string, userInput: string, sentence: string): Promise<EvaluationResult> {
        const prompt = `
      The target word was "${targetWord}". 
      The context sentence was: "${sentence}".
      The user input to fill the blank was: "${userInput}".
      
      Evaluate the user's input strictly but helpfully.
      Return a JSON object ONLY, without markdown formatting:
      {
        "isCorrect": boolean, // true if exact match or acceptable variation (e.g. case insensitive)
        "type": "CORRECT" | "TYPO" | "WRONG_MEANING" | "UNRELATED" | "CLOSE_SYNONYM",
        "feedback": "String in Traditional Chinese. If correct, praise briefly. If typo, point it out. If wrong meaning, explain why WITHOUT revealing the correct answer. If synonym, acknowledge it but say the target word is better here (do not explicitly state the target word)."
      }
    `;

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
