
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getGameCommentary(score: number, distance: number) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just finished a car racing game. 
      Score: ${score}. 
      Distance: ${Math.floor(distance)} meters.
      Provide a very short (max 15 words) snarky or encouraging comment as an AI driving instructor.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text?.trim() || "Drive safer next time!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The engine stalled, but you survived!";
  }
}
