# Synapse 🧠

**Synapse** is a modern, AI-powered English vocabulary learning application designed to help you master new words through context and spaced repetition.

Built with **React**, **Tailwind CSS**, and **Google Gemini / OpenAI**, Synapse transforms simple word lists into comprehensive learning experiences.

## ✨ Features

### 🤖 AI-Powered Learning
- **Contextual Generation**: Enter a word, and Synapse generates a business/TOEIC-oriented sentence, translation, and cloze test instantly.
- **Smart Feedback**: Get detailed explanations for wrong answers (without spoilers!) explaining *why* a word doesn't fit the context.
- **Customizable Prompts**: Tweak the system prompts to change the difficulty, context, or feedback style.

### 📚 Effective Study Tools
- **Spaced Repetition System (SRS)**: Smart scheduling ensures you review words at the optimal time to move them into long-term memory.
- **Dynamic Quizzes**: Practice with fill-in-the-blank questions.
- **Smart Hints**: Reveal the first letter or get a subtle nudge when you're stuck.
- **Mistake Tracking**: Track your error history to focus on problem words.

### ⚡ Power User Features
- **Batch Input**: Add dozens of words at once for background processing.
- **Dashboard Sorting**: Sort your vocabulary by Date, A-Z, Reviews, or Mistakes.
- **Data Management**: Export your progress to JSON and import it on any device.
- **Concurrency Control**: Adjust how many words are processed in parallel.

### 🛠️ Flexible LLM Support
- **Google Gemini**: Cost-effective and fast usage (Default).
- **OpenAI / Local LLM**: Support for OpenAI API and local models (via vLLM/Ollama) for privacy and customization.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (or OpenAI Key)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/q12we34rt5/Synapse.git
    cd Synapse
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Configure API Key**
    - Open the app in your browser (usually `http://localhost:5173`).
    - Click the **Gear Icon** (Settings) in the top right.
    - Enter your **Gemini API Key**.
    - Start adding words!

## 💻 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand (with persistence)
- **Icons**: Lucide React
- **AI Integration**: Google Generative AI SDK, OpenAI SDK

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
