import { Question } from "../types";

// Helper to convert file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const evaluateShortAnswer = async (userAnswer: string, correctAnswer: string, showToast: (message: string) => void): Promise<boolean> => {
  try {
    const response = await fetch('/.netlify/functions/evaluate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAnswer, correctAnswer }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Server error during evaluation.' }));
      throw new Error(errorData.error);
    }

    const { isCorrect } = await response.json();
    return isCorrect;
  } catch (error) {
    console.error("API call to evaluate-answer failed:", error);
    showToast(`Evaluation failed: ${(error as Error).message}`);
    // Fallback to a simple string comparison if the API fails
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
};


export const generateQuizFromContent = async (source: { file?: File; text?: string }, numQuestions: number, showToast: (message:string) => void): Promise<Question[] | null> => {
  try {
    let bodyPayload: object;

    if (source.file) {
      const base64Data = await fileToBase64(source.file);
      bodyPayload = {
        source: { base64Data, mimeType: source.file.type },
        numQuestions
      };
    } else if (source.text && source.text.trim()) {
      bodyPayload = {
        source: { text: source.text },
        numQuestions
      };
    } else {
      showToast("No source content provided.");
      return null;
    }
    
    const response = await fetch('/.netlify/functions/generate-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error during quiz generation.' }));
        throw new Error(errorData.error);
    }

    const generatedQuestions = await response.json() as Omit<Question, 'id'>[];
    return generatedQuestions.map(q => ({ ...q, id: `q_${new Date().getTime()}_${Math.random()}` }));

  } catch (error) {
    console.error("API call to generate-quiz failed:", error);
    showToast(`AI generation failed: ${(error as Error).message}. Please try again.`);
    return null;
  }
};
