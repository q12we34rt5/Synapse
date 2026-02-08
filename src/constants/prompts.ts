export const DEFAULT_PROMPTS = {
  generateData: `
Generate a sentence using the English word "\${word}". 
The sentence should be suitable for the TOEIC exam (Business English, workplace scenarios, formal context). 
Return a JSON object ONLY, without markdown formatting, with the following structure:
{
  "original": "\${word}",
  "sentence": "The full sentence containing the word, in a business/professional context.",
  "translation": "Traditional Chinese translation of the sentence.",
  "wordTranslation": "Traditional Chinese translation of the word '\${word}'",
  "cloze": "The sentence with the word '\${word}' (and its variations like plurals/tenses if applicable) replaced by '__________'."
}`,
  generateQuestion: `
Generate a NEW sentence using the English word "\${word}". 
The sentence should be different from common examples and suitable for the TOEIC exam (Business English, workplace scenarios). 
Return a JSON object ONLY, without markdown formatting:
{
  "sentence": "The full sentence containing the word, in a business/professional context.",
  "translation": "Traditional Chinese translation of the sentence.",
  "cloze": "The sentence with the word '\${word}' replaced by '__________'."
}`,
  evaluateAnswer: `
The target word was "\${targetWord}". 
The context sentence was: "\${sentence}".
The user input to fill the blank was: "\${userInput}".

Evaluate the user's input strictly but helpfully, considering TOEIC standards.
Return a JSON object ONLY, without markdown formatting:
{
  "isCorrect": boolean, // true if exact match or acceptable business English variation
  "type": "CORRECT" | "TYPO" | "WRONG_MEANING" | "UNRELATED" | "CLOSE_SYNONYM",
  "feedback": "String in Traditional Chinese. If correct, praise briefly. If wrong, explain WHY (grammar, meaning, nuance) the user's input is incorrect, but **NEVER** reveal the target word or correct answer. Focus on guiding the user to the answer without giving it away."
}`
};
