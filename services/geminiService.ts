
import { GoogleGenAI } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGameCommentary(score: number, distance: number, level: number, hp: number) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just finished a car racing game. 
      The car is named "Veera Bhaahu".
      Route: Sethurapatti to Vannamayil. 
      Score: ${score}. 
      Distance covered: ${Math.floor(distance)} meters.
      Reached Level: ${level}.
      Remaining HP: ${hp}.
      Provide a very short (max 15 words) snarky or encouraging comment as an AI driving instructor. 
      Refer to the driver or the car as "Veera Bhaahu" and mention if they actually made it closer to Vannamayil or failed miserably.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text?.trim() || "Veera Bhaahu stalled. Vannamayil awaits!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Veera Bhaahu engine cut out before reaching Vannamayil.";
  }
}
