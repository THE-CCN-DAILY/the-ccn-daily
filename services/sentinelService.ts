
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
    const isPlatformKeyValid = !!(platformKey && platformKey.startsWith('AIza') && platformKey !== 'undefined');
    const apiKey = isPlatformKeyValid ? platformKey : userKey;

    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    const model = 'gemini-3-flash-preview';

    const prompt = `You are the Project Phoenix Strategic Sentinel. 
    Analyze the current roadmap: ${JSON.stringify(currentRoadmap)}.
    
    Look for:
    1. New Gemini 3 capabilities (Thinking, Live, Search).
    2. Cost optimization (e.g. moving tasks from Pro to Flash-Lite).
    3. Multimodal opportunities (Veo for visuals, Lyria for music).
    
    Return a JSON array of specific, actionable tech updates to make the app better and more affordable.
    Each update must have: featureId, currentTech, recommendedUpdate, reason, affordabilityGain (Higher/Lower/Neutral), impact.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
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
              impact: { type: Type.STRING },
            },
            required: ["featureId", "currentTech", "recommendedUpdate", "reason", "affordabilityGain", "impact"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Sentinel Audit Failed:", error);
    return [];
  }
};
