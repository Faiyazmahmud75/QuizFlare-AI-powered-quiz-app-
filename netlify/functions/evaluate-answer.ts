import { GoogleGenAI } from "@google/genai";
import type { Handler } from "@netlify/functions";

// This is the serverless function for evaluating answers.
export const handler: Handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Check for API Key in environment variables
    if (!process.env.API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key is not configured on the server." }) };
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const { userAnswer, correctAnswer } = JSON.parse(event.body || '{}');
        const prompt = `You are an expert, multilingual quiz evaluator. Your task is to determine if the user's answer is correct, even if it's in a different language from the provided correct answer. The correct answer is: '${correctAnswer}'. The user's submitted answer is: '${userAnswer}'. Evaluate if the user's answer is semantically and factually equivalent to the correct answer. For example, if the correct answer is 'Dhaka' and the user answers 'ঢাকা', it is correct. Consider synonyms, common knowledge, minor typos, and context. Respond with only the single word 'Correct' or 'Incorrect'.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });

        const resultText = response.text.trim().toLowerCase();
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCorrect: resultText === 'correct' }),
        };

    } catch (error) {
        console.error("Error in evaluate-answer function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to evaluate answer." }) };
    }
};
