import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import type { Handler } from "@netlify/functions";

// This is the serverless function that will be deployed to Netlify.
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
        const { source, numQuestions } = JSON.parse(event.body || '{}');
        let contentPart: Part;

        // Determine if the source is a file (base64) or text
        if (source.base64Data && source.mimeType) {
            contentPart = { inlineData: { mimeType: source.mimeType, data: source.base64Data } };
        } else if (source.text && source.text.trim()) {
            contentPart = { text: source.text };
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: "No source content provided." }) };
        }

        const prompt = `Based on the content of the provided document/text, generate ${numQuestions} quiz questions. The question types can be 'MCQ' or 'Short Answer'. Provide the response as a valid JSON array of objects. Each object must have: 'type' ('MCQ' or 'Short Answer'), 'text' (the question), 'options' (an array of 4 strings, only for MCQ), 'correctAnswerIndex' (a number from 0-3, only for MCQ), and 'correctAnswer' (a string, only for Short Answer). Do not include any other text or formatting outside of the JSON array. For 'Short Answer' questions, 'options' and 'correctAnswerIndex' should be omitted. For 'MCQ' questions, 'correctAnswer' should be omitted.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: [{text: prompt}, contentPart],
            config: { responseMimeType: "application/json" }
        });
        
        // Clean the response just in case it's wrapped in markdown
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: jsonStr,
        };

    } catch (error) {
        console.error("Error in generate-quiz function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate quiz." }) };
    }
};
