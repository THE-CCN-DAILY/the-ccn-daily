
import { GoogleGenAI, Type } from "@google/genai";
import type { DevotionalOutput, Message } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// The "Direct Link" (Dashboard) for snappy client interactions
// Using the most cost-effective Flash models to stay within free tier quotas.
const platformKey = process.env.GEMINI_API_KEY;
const userKey = process.env.API_KEY;

// Robust key selection: Use platform key if it looks valid (starts with AIza), otherwise use user key.
const isPlatformKeyValid = !!(platformKey && platformKey.startsWith('AIza') && platformKey !== 'undefined');
const apiKey = isPlatformKeyValid ? platformKey : userKey;

const ai = new GoogleGenAI({ apiKey: apiKey || "" });
const CLIENT_MODEL = 'gemini-3-flash-preview';
const REASONING_MODEL = 'gemini-3-flash-preview'; // Using Flash 3 for speed and cost efficiency

export const getAiCoachResponse = async (newMessage: string, history: Message[]): Promise<string> => {
    try {
        const contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: newMessage }] });

        const response = await ai.models.generateContent({
            model: CLIENT_MODEL,
            contents: contents,
            config: { systemInstruction: "You are Kai, an empathetic AI Spiritual Coach." }
        });
        return response.text || "";
    } catch (error) {
        console.error("Coach Error:", error);
        throw new Error("Coach failed.");
    }
};

/**
 * Uses Search Grounding to find real-world events for prayer.
 * Part of the "Direct Link" for immediate community pulse.
 */
export const getGroundedPrayerTopics = async (): Promise<any[]> => {
    try {
        const response = await ai.models.generateContent({
            model: CLIENT_MODEL,
            contents: "List 3 significant global or humanitarian events happening today that need prayer and empathy.",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const text = response.text || "";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return chunks.map((chunk: any) => ({
            title: chunk.web?.title || "Current Event",
            uri: chunk.web?.uri,
            snippet: text.substring(0, 150) + "..."
        }));
    } catch (e) {
        console.error("Grounding Error:", e);
        return [];
    }
};

export const getDeepTheologicalInsight = async (question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: question,
            config: {
                systemInstruction: "You are a scholarly theologian providing balanced, deep insights into spiritual questions. Be compassionate yet rigorous."
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Reasoning Error:", e);
        throw new Error("Deep thinking failed.");
    }
};

export const generateQuoteImage = async (prompt: string): Promise<string> => {
    // Image generation is temporarily disabled to save costs.
    // In a production app, this would be gated by a premium subscription.
    throw new Error("PREMIUM_FEATURE: AI Image generation is currently reserved for Premium members to ensure sustainable growth.");
};

export const generateTagsForNote = async (noteText: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: CLIENT_MODEL,
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
        console.error("Tagging Error:", e);
        return ["Reflection"];
    }
};

/**
 * The "Refinery" (Genkit Orchestrator) for complex backend logic.
 * This calls our custom Genkit flow on the server, which now uses RAG
 * to fetch user notes directly from Firestore.
 */
export const generatePersonalizedDevotional = async (userId: string, name: string): Promise<DevotionalOutput> => {
    try {
        // Step 1: Fetch user context directly from Firestore (Frontend RAG)
        const notesRef = collection(db, 'users', userId, 'notes');
        const q = query(notesRef, orderBy('createdAt', 'desc'), limit(5));
        const notesSnapshot = await getDocs(q);
        
        const notesContext = notesSnapshot.docs
            .map(doc => doc.data().text)
            .join('\n');

        const prompt = `Create a deeply personal and encouraging daily devotional for ${name}.
        
        User's Recent Reflections:
        ${notesContext || 'No recent notes found. Focus on general spiritual growth.'}
        
        Base the core theme on the most recent articles from https://theccndaily.substack.com/.
        
        You are Pastor Eryeza, a wise and warm spiritual guide. You synthesize the latest teachings from the Substack newsletter with the user's personal journey.
        
        Return a JSON object with: title, openingVerse, body, prayer, declaration, furtherStudy (array of strings).`;

        const response = await ai.models.generateContent({
            model: CLIENT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        openingVerse: { type: Type.STRING },
                        body: { type: Type.STRING },
                        prayer: { type: Type.STRING },
                        declaration: { type: Type.STRING },
                        furtherStudy: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["title", "openingVerse", "body", "prayer", "declaration", "furtherStudy"]
                }
            }
        });

        if (!response.text) throw new Error("No response from AI");
        
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Devotional Error:", e);
        throw new Error("Failed to generate personalized devotional.");
    }
};

/**
 * For long-running video generation, we still use the direct API for now
 * but wrapped in our enterprise mindset.
 */
export const generateSanctuaryVideo = async (prompt: string, onProgress: (msg: string) => void): Promise<string> => {
    // Video generation is temporarily disabled to save costs.
    // In a production app, this would be gated by a premium subscription.
    throw new Error("PREMIUM_FEATURE: AI Cinematic Video generation is currently reserved for Premium members to ensure sustainable growth.");
};
