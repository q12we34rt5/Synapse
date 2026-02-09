import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/useAppStore';
import { X, Settings as SettingsIcon, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_PROMPTS } from '../constants/prompts';

export const SettingsModal: React.FC = () => {
    const { settings, setSettings, words, reviews, importData } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    // State for form fields
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [provider, setProvider] = useState<'gemini' | 'openai'>(settings.provider);
    const [baseUrl, setBaseUrl] = useState(settings.baseUrl || 'http://localhost:8000/v1');
    const [modelName, setModelName] = useState(settings.modelName || 'meta-llama/Meta-Llama-3-8B-Instruct');
    const [concurrencyLimit, setConcurrencyLimit] = useState(settings.concurrencyLimit || 1);
    const [useCustomPrompts, setUseCustomPrompts] = useState(settings.useCustomPrompts || false);
    const [prompts, setPrompts] = useState(settings.prompts || DEFAULT_PROMPTS);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update local state when modal opens to match store (in case store changed elsewhere)
    React.useEffect(() => {
        if (isOpen) {
            setApiKey(settings.apiKey);
            setProvider(settings.provider);
            setBaseUrl(settings.baseUrl || 'http://localhost:8000/v1');
            setModelName(settings.modelName || 'meta-llama/Meta-Llama-3-8B-Instruct');
            setConcurrencyLimit(settings.concurrencyLimit || 1);
            setUseCustomPrompts(settings.useCustomPrompts || false);
            setPrompts(settings.prompts || DEFAULT_PROMPTS);
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        setSettings({
            apiKey,
            provider,
            baseUrl,
            modelName,
            concurrencyLimit,
            useCustomPrompts,
            prompts,
        });
        setIsOpen(false);
    };

    const handleExport = () => {
        const data = {
            words,
            reviews,
            settings: {
                ...settings,
                apiKey: '', // Don't export API key for security
            },
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `synapse-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                // Basic validation
                if (!data.words || !data.reviews) {
                    throw new Error('Invalid backup file format');
                }

                if (window.confirm('This will merge the imported data with your current data. Existing words with same IDs will be overwritten. Continue?')) {
                    importData(data);
                    alert('Data imported successfully!');
                    setIsOpen(false);
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import data. Invalid file format.');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Settings"
            >
                <SettingsIcon className="w-6 h-6 text-slate-300" />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Settings</h2>
                                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* LLM Settings */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">LLM Configuration</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                Provider
                                            </label>
                                            <select
                                                value={provider}
                                                onChange={(e) => setProvider(e.target.value as 'gemini' | 'openai')}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openai">Local LLM / OpenAI</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                API Key
                                            </label>
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder={provider === 'openai' ? "Optional for local" : "Enter API Key"}
                                            />
                                        </div>

                                        {provider === 'openai' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Base URL</label>
                                                    <input
                                                        type="text"
                                                        value={baseUrl}
                                                        onChange={(e) => setBaseUrl(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        placeholder="http://localhost:8000/v1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Model Name</label>
                                                    <input
                                                        type="text"
                                                        value={modelName}
                                                        onChange={(e) => setModelName(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        placeholder="meta-llama/Meta-Llama-3-8B-Instruct"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                Concurrency Limit (Parallel Requests)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="16"
                                                    value={concurrencyLimit}
                                                    onChange={(e) => setConcurrencyLimit(parseInt(e.target.value))}
                                                    className="flex-1 accent-indigo-500"
                                                />
                                                <span className="text-white font-mono bg-slate-700 px-2 py-1 rounded">
                                                    {concurrencyLimit}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Higher values process words faster but may hit API rate limits.</p>
                                        </div>
                                    </div>

                                    <hr className="border-slate-700" />

                                    {/* Prompt Configuration */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Prompt Configuration</h3>
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={useCustomPrompts}
                                                        onChange={(e) => {
                                                            setUseCustomPrompts(e.target.checked);
                                                            // If enabling and prompts are empty, fill with defaults
                                                            if (e.target.checked) {
                                                                setPrompts(prev => ({
                                                                    generateData: prev.generateData || DEFAULT_PROMPTS.generateData,
                                                                    generateQuestion: prev.generateQuestion || DEFAULT_PROMPTS.generateQuestion,
                                                                    evaluateAnswer: prev.evaluateAnswer || DEFAULT_PROMPTS.evaluateAnswer
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 flex-shrink-0"></div>
                                                    <span className="ml-2 text-sm font-medium text-slate-300 whitespace-nowrap">Enable Custom Prompts</span>
                                                </label>
                                            </div>
                                        </div>

                                        {useCustomPrompts && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm">
                                                    <p>⚠️ Advanced setting: Incorrect prompts may cause the AI to fail or produce invalid JSON.</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="block text-sm font-medium text-slate-300">
                                                                Word Generation Prompt
                                                            </label>
                                                            <button
                                                                onClick={() => setPrompts(prev => ({ ...prev, generateData: DEFAULT_PROMPTS.generateData }))}
                                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                                            >
                                                                Reset to Default
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mb-2">
                                                            Available variables: <code className="bg-slate-700 px-1 rounded">{'${word}'}</code>
                                                        </div>
                                                        <textarea
                                                            value={prompts.generateData}
                                                            onChange={(e) => setPrompts({ ...prompts, generateData: e.target.value })}
                                                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="block text-sm font-medium text-slate-300">
                                                                Question Generation Prompt
                                                            </label>
                                                            <button
                                                                onClick={() => setPrompts(prev => ({ ...prev, generateQuestion: DEFAULT_PROMPTS.generateQuestion }))}
                                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                                            >
                                                                Reset to Default
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mb-2">
                                                            Available variables: <code className="bg-slate-700 px-1 rounded">{'${word}'}</code>
                                                        </div>
                                                        <textarea
                                                            value={prompts.generateQuestion}
                                                            onChange={(e) => setPrompts({ ...prompts, generateQuestion: e.target.value })}
                                                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="block text-sm font-medium text-slate-300">
                                                                Answer Evaluation Prompt
                                                            </label>
                                                            <button
                                                                onClick={() => setPrompts(prev => ({ ...prev, evaluateAnswer: DEFAULT_PROMPTS.evaluateAnswer }))}
                                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                                            >
                                                                Reset to Default
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mb-2">
                                                            Available variables: <code className="bg-slate-700 px-1 rounded">{'${targetWord}'}</code>, <code className="bg-slate-700 px-1 rounded">{'${sentence}'}</code>, <code className="bg-slate-700 px-1 rounded">{'${userInput}'}</code>
                                                        </div>
                                                        <textarea
                                                            value={prompts.evaluateAnswer}
                                                            onChange={(e) => setPrompts({ ...prompts, evaluateAnswer: e.target.value })}
                                                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-slate-700" />

                                    {/* Data Management */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Data Management</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleExport}
                                                className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                                            >
                                                <Upload className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Export JSON</span>
                                            </button>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                                            >
                                                <Download className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Import JSON</span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImport}
                                                accept=".json"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleSave}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div >
                    )}
                </AnimatePresence >,
                document.body
            )}
        </>
    );
};
