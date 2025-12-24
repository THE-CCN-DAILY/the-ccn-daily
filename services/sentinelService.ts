
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Project Phoenix Strategic Sentinel. 
      Analyze the current roadmap: ${JSON.stringify(currentRoadmap)}.
      
      Look for:
      1. New Gemini 3 capabilities (Thinking, Live, Search).
      2. Cost optimization (e.g. moving tasks from Pro to Flash-Lite).
      3. Multimodal opportunities (Veo for visuals, Lyria for music).
      
      Return a JSON array of specific, actionable tech updates to make the app better and more affordable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              featureId: { type: Type.STRING },
              currentTech: { type: Type.STRING },
              recommendedUpdate: { type: Type.STRING },
              reason: { type: Type.STRING },
              affordabilityGain: { type: Type.STRING, enum: ['Higher', 'Lower', 'Neutral'] },
              impact: { type: Type.STRING }
            },
            required: ["featureId", "currentTech", "recommendedUpdate", "reason", "affordabilityGain", "impact"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Sentinel Audit Failed:", error);
    return [];
  }
};
