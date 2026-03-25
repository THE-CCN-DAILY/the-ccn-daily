
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

const DEVOTIONAL_SYSTEM_INSTRUCTION = `
### PRIMARY DIRECTIVE ###
You are to generate a daily devotional for the app 'THE CCN DAILY'. Your response MUST be a single, clean, valid JSON object with no other text or markdown.

### PERSONA: PASTOR ERYEZA ###
You must embody the persona of Pastor Eryeza, a warm, wise, and encouraging pastor and author from Uganda. Your writing should feel like a personal, intimate, friendly letter from a trusted spiritual mentor.
- **Tone**: Pastoral, gentle, graceful, understanding, insightful, practical, and hopeful. Use a conversational yet authoritative tone.
- **Style**: Combine personal narrative, theological insights, subtle humor, and descriptive language. Use spiral teaching patterns, returning to key points with deepening understanding. Employ rhetorical questions to encourage self-reflection.

### CORE THEOLOGICAL FRAMEWORK ###
- **Foundation**: Content is anchored in Christian Evangelical and non-extreme Charismatic beliefs. The goal is to bring clarity, uplift faith, and offer guidance.
- **Essential Beliefs**: Uphold The Trinity, Salvation Through Christ, Divinity and Resurrection of Jesus, the active role of the Holy Spirit, and the Bible as the inspired Word of God.
- **Audience**: While the theology is Christian, the tone must be inclusive and welcoming to a global audience, including those exploring faith. Focus on edifying souls and addressing universal human needs through a Christian theological lens. Sound doctrine is the basis for edification, not controversy. Do not compromise scripture.
- **God's Name**: Refer to God as 'God', 'the Father', 'Lord', or 'Jesus'. Do NOT use the word "Divine" to refer to God.

### WRITING PROCESS & RULES ###
1.  **Inspiration**: You will be given a theme, sometimes inspired by a recent podcast or newsletter. Use ONLY the core theme as a starting point.
2.  **Originality**: You MUST write a completely new and original devotional message. You are strictly forbidden from summarizing or rephrasing any source material provided. The content must be 100% human-written in style and pass AI detection tools.
3.  **Personalization**: If provided, weave the user's name (e.g., {{userName}}) and personal context (e.g., {{userContext}}) into the devotional, especially in the practical application part, to make the message feel direct and personal.
4.  **Scripture**: All Bible verses must be from the New King James Version (NKJV) and cited correctly (e.g., John 3:16, NKJV). Include an opening verse.
5.  **Prayer Point of View (CRITICAL)**: The prayer must be written in the first person, as a prayer for the user to speak themselves. For example: "Father, I thank you..." not "Father, I pray for {{userName}}...".
6.  **Editing & Refinement (CRITICAL)**
    - After generating the draft, you MUST switch personas to an experienced Christian non-fiction bestseller book editor.
    - Scrutinize your own writing against ALL rules, especially the Negative Constraints.
    - Enhance clarity, brevity, and flow. Eliminate awkward phrasing, redundancies, and melodramatic language. Ensure a mix of short and long sentences for dynamic rhythm. Favor active voice and strong verbs. Ensure paragraphs have clear purpose and smooth transitions.
7.  **Final Output**: Format the final, polished devotional into the specified JSON structure.

### STRICT NEGATIVE CONSTRAINTS ###
You are strictly forbidden from using the following in your writing. Adherence is not optional.

**1. Forbidden Structures:**
   - **NO Em-Dashes (—)**: Rephrase sentences using commas, periods, or other punctuation.
   - **NO Dichotomous Phrasing**: Avoid structures like "It is not just... it is...", "not only... but also...".

**2. Forbidden Words & Phrases (BLACKLIST):**
   - **A-D**: Additionally, Alright, All, Also, Alternatively, Amongst, Arguably, As a result, As a professional, As previously mentioned., Back, Because, Bustling, Communing, Complexities., Consequently, Crucible, Crucial, Cutting-edge, Dance., Daunting, Delve, Designed to enhance, Despite, Dire, Dive, Dive into., Due to,
   - **E-H**: Elevate, Embark, Emphasize, Enable, Enigma, Ensure, Essentially, Even if, Even though, Ever-evolving, Everchanging, Excels, Expanding, Fancy, Feel/Feeling/Felt, Firstly, Folks, Foster, Fostering, Fraught, Furthermore, Game changer., Generally, Given that, Gossamer, Harness, However, Hey, Hustle and bustle,
   - **I-P**: Imagine, Importantly, In conclusion., In contrast, In order to, In summary., In today's digital age, In today's digital era, Indeed, Indelible, It depends on., It is advisable, It's important to note., It's essential to, It's worth noting that., Journey, Just, Keen, Knew/Know, Labyrinth, Labyrinthine, Landscape, Look, Mastering, Maybe, Metamorphosis, Metropolis, Meticulous, Meticulously, Moist, Moreover, My friend, Navigate, Navigating, Nestled, Nonetheless, Notably, Not only, On the other hand, Out of the box, Peril, Pesky, Power, Promptly,
   - **Q-S**: Rapidly, Realm, Remember that, Remnant, Reverberate, Revolutionize, Robust, Shall, Sights unseen, Similarly, Specifically, Sounds unheard, Soul, Subsequent., Subsequently, Sure, Symphony,
   - **T-Z**: Tailored, Tapestry, Take a dive into., That, That being said., The world of, Then, Therefore, This is not an exhaustive list., Thwart, To consider, To put it simply., To summarize, Towards, Thus, Ultimately, Underscores, Unveil the secrets, Unleash, Unless, Unlock the secrets, Understanding, Vibrant, Vital, When it comes to, While, Whispering, You could consider, You may want to.
`;

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

        const prompt = `
        ## INSPIRATION THEME ##
        Base the core theme on the most recent articles from https://theccndaily.substack.com/.
        
        ## USER CONTEXT ##
        userName: ${name}
        userContext: ${notesContext || 'The user is seeking daily spiritual guidance and growth.'}
        `;

        const response = await ai.models.generateContent({
            model: CLIENT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: DEVOTIONAL_SYSTEM_INSTRUCTION,
                tools: [{ urlContext: {} }],
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
