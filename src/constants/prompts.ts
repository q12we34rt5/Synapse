export const DEFAULT_PROMPTS = {
    generateData: `
Generate a sentence using the English word "\${word}". 
The sentence should be suitable for an intermediate English learner. 
Return a JSON object ONLY, without markdown formatting, with the following structure:
{
  "original": "\${word}",
  "sentence": "The full sentence containing the word.",
  "translation": "Traditional Chinese translation of the sentence.",
  "wordTranslation": "Traditional Chinese translation of the word '\${word}'",
  "cloze": "The sentence with the word '\${word}' (and its variations like plurals/tenses if applicable) replaced by '__________'."
}`,
    generateQuestion: `
Generate a NEW sentence using the English word "\${word}". 
The sentence should be different from common examples and suitable for an intermediate learner. 
Return a JSON object ONLY, without markdown formatting:
{
  "sentence": "The full sentence containing the word.",
  "translation": "Traditional Chinese translation of the sentence.",
  "cloze": "The sentence with the word '\${word}' replaced by '__________'."
}`,
    evaluateAnswer: `
The target word was "\${targetWord}". 
The context sentence was: "\${sentence}".
The user input to fill the blank was: "\${userInput}".

Evaluate the user's input strictly but helpfully.
Return a JSON object ONLY, without markdown formatting:
{
  "isCorrect": boolean, // true if exact match or acceptable variation (e.g. case insensitive)
  "type": "CORRECT" | "TYPO" | "WRONG_MEANING" | "UNRELATED" | "CLOSE_SYNONYM",
  "feedback": "String in Traditional Chinese. If correct, praise briefly. If typo, point it out. If wrong meaning, explain why WITHOUT revealing the correct answer. If synonym, acknowledge it but say the target word is better here (do not explicitly state the target word)."
}`
};
