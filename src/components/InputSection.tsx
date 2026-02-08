import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GeminiProvider } from '../services/llm/GeminiProvider';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import { Loader2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { LLMService } from '../services/llm/LLMService';

export const InputSection: React.FC = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addWord, settings } = useAppStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Validation based on provider
        if (settings.provider === 'gemini' && !settings.apiKey) {
            alert('Please configure your Gemini API Key in settings.');
            return;
        }

        setIsLoading(true);
        try {
            let llm: LLMService;
            if (settings.provider === 'openai') {
                llm = new OpenAIProvider(settings.apiKey, settings.baseUrl, settings.modelName, settings.prompts);
            } else {
                llm = new GeminiProvider(settings.apiKey, settings.prompts);
            }

            const data = await llm.generateWordData(input.trim());

            // Add enabled: true and map question IDs
            addWord({
                id: uuidv4(),
                ...data,
                questions: data.questions.map(q => ({ ...q, id: uuidv4() })),
                enabled: true,
                addedAt: Date.now(),
            });
            setInput('');
        } catch (error) {
            console.error(error);
            alert('Failed to generate word data. Please check your API Key.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg relative z-10">
            <div className="relative group">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter a word to learn..."
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4 text-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg transition-all"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
            </div>
            {settings.provider === 'gemini' && !settings.apiKey && (
                <p className="text-center text-amber-400 text-sm mt-2">
                    Please configure your API Key in settings first.
                </p>
            )}
        </form>
    );
};
