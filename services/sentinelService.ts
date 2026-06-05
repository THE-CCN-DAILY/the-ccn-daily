
import { generateCloudflareText } from './geminiService';

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
    const prompt = `You are the Project Phoenix Strategic Sentinel. 
    Analyze the current roadmap: ${JSON.stringify(currentRoadmap)}.
    
    Look for:
    1. Cloudflare-native capabilities that can replace older vendor-specific assumptions.
    2. Cost optimization that keeps the app viable on free or low-cost tiers.
    3. Practical multimodal opportunities that can be supported by the current release experience.
    
    Return a JSON array of specific, actionable tech updates to make the app better and more affordable.
    Each update must be an object with these fields:
    - featureId: string
    - currentTech: string
    - recommendedUpdate: string
    - reason: string
    - affordabilityGain: "Higher" | "Lower" | "Neutral"
    - impact: string

    Return ONLY the JSON array.`;

    const responseText = await generateCloudflareText({
      feature: 'techSentinel',
      model: '@cf/meta/llama-3.1-8b-instruct',
      prompt,
      systemInstruction: 'Return only a JSON array of technical audit objects.',
    });

    if (!responseText) {
      console.warn("Sentinel: background response text is empty.");
      return [];
    }
    
    try {
      // Clean up the response text in case there's markdown
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error("Sentinel: Failed to parse background response:", responseText);
      return [];
    }
  } catch (error) {
    console.error("Sentinel Audit Failed:", error);
    throw error; // Re-throw to allow hooks to catch it
  }
};
