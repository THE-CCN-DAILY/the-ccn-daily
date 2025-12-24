
import { GoogleGenAI, Type, Content } from "@google/genai";
import type { DevotionalOutput, Message } from '../types';

// Use process.env.API_KEY directly for initialization as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL = 'gemini-3-flash-preview';
const REASONING_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const getAiCoachResponse = async (newMessage: string, history: Message[]): Promise<string> => {
    const contents: Content[] = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: newMessage }] });
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: contents,
            config: { systemInstruction: "You are Kai, an empathetic AI Spiritual Coach." }
        });
        return response.text || "";
    } catch (error) {
        throw new Error("Coach failed.");
    }
};

/**
 * Uses Search Grounding to find real-world events for prayer.
 * Part of Phase 5 implementation.
 */
export const getGroundedPrayerTopics = async (): Promise<any[]> => {
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: "List 3 significant global or humanitarian events happening today that need prayer and empathy.",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const text = response.text || "";
        return chunks.map((chunk: any) => ({
            title: chunk.web?.title || "Current Event",
            uri: chunk.web?.uri,
            snippet: text.substring(0, 150) + "..."
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
};

/**
 * Uses Gemini 3 Pro with thinking budget for deep theological reasoning.
 * Part of Phase 5 implementation.
 */
export const getDeepTheologicalInsight = async (question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: question,
            config: {
                thinkingConfig: { thinkingBudget: 16000 },
                systemInstruction: "You are a scholarly theologian providing balanced, deep insights into spiritual questions. Be compassionate yet rigorous."
            }
        });
        return response.text || "";
    } catch (e) {
        throw new Error("Deep thinking failed.");
    }
};

/**
 * Generates an inspirational background image for a quote.
 */
export const generateQuoteImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
    } catch (e) {
        throw new Error("Image failed.");
    }
};

/**
 * Generates tags for a spiritual note using JSON mode.
 */
export const generateTagsForNote = async (noteText: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Analyze the following spiritual note and generate 3-5 short, one-word tags: "${noteText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        return ["Reflection"];
    }
};

/**
 * Generates a personalized daily devotional based on user context.
 */
export const generatePersonalizedDevotional = async (userContext: any): Promise<DevotionalOutput> => {
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Create a deeply personal and encouraging daily devotional for ${userContext.name}.
            Current life themes: ${userContext.recentNoteThemes?.join(', ') || 'spiritual growth'}.
            Prayer focus areas: ${userContext.recentPrayerTopics?.join(', ') || 'daily guidance'}.`,
            config: {
                systemInstruction: "You are Pastor Eryeza, a wise and warm spiritual guide. Provide output in JSON format strictly following the schema.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        openingVerse: { type: Type.STRING },
                        body: { type: Type.STRING },
                        prayer: { type: Type.STRING },
                        declaration: { type: Type.STRING },
                        furtherStudy: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "openingVerse", "body", "prayer", "declaration", "furtherStudy"]
                }
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("Failed to generate personalized devotional.");
    }
};
