
import { GoogleGenAI, Type } from "@google/genai";

export interface TechAudit {
  featureId: string;
  currentTech: string;
  recommendedUpdate: string;
  reason: string;
  affordabilityGain: 'Higher' | 'Lower' | 'Neutral';
  impact: string;
}

/**
 * The Sentinel checks the app's current architecture against the latest
 * tech capabilities and provides an "Evolution Suggestion".
 */
export const runTechSentinelAudit = async (currentRoadmap: any): Promise<TechAudit[]> => {
  try {
    const platformKey = process.env.GEMINI_API_KEY;
    const userKey = process.env.API_KEY;
    const apiKey = (platformKey && platformKey !== 'undefined') ? platformKey : userKey;

    if (!apiKey || apiKey === 'undefined') {
      console.warn("Sentinel: Gemini API Key is missing.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const prompt = `You are the Project Phoenix Strategic Sentinel. 
    Analyze the current roadmap: ${JSON.stringify(currentRoadmap)}.
    
    Look for:
    1. New Gemini 3 capabilities (Thinking, Live, Search).
    2. Cost optimization (e.g. moving tasks from Pro to Flash-Lite).
    3. Multimodal opportunities (Veo for visuals, Lyria for music).
    
    Return a JSON array of specific, actionable tech updates to make the app better and more affordable.
    Each update must be an object with these fields:
    - featureId: string
    - currentTech: string
    - recommendedUpdate: string
    - reason: string
    - affordabilityGain: "Higher" | "Lower" | "Neutral"
    - impact: string

    Return ONLY the JSON array.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      console.warn("Sentinel: AI response text is empty.");
      return [];
    }
    
    try {
      // Clean up the response text in case there's markdown
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error("Sentinel: Failed to parse AI response:", response.text);
      return [];
    }
  } catch (error) {
    console.error("Sentinel Audit Failed:", error);
    throw error; // Re-throw to allow hooks to catch it
  }
};
