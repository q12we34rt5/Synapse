import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMService, EvaluationResult } from "./LLMService";


export class GeminiProvider implements LLMService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        const prompt = `
      Generate a NEW sentence using the English word "${word}". 
      The sentence should be different from common examples and suitable for an intermediate learner. 
      Return a JSON object ONLY, without markdown formatting:
      {
        "sentence": "The full sentence containing the word.",
        "translation": "Traditional Chinese translation of the sentence.",
        "cloze": "The sentence with the word '${word}' replaced by '__________'."
      }
    `;

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
