
import type { DevotionalOutput, Message } from '../types';
import { listJournalEntries } from './journalService';

// 3-Lane AI Policy for Cost Governance, now routed through Cloudflare Pages.
// LITE: default free-plan text generation.
// FLASH: richer text reasoning while staying in Workers AI.
// PRO: reserved for max/admin flows and mapped server-side when a stronger model is configured.
export const LITE_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const FLASH_MODEL = '@cf/meta/llama-3.1-8b-instruct';
export const PRO_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export type UserTier = 'guest' | 'free' | 'pro' | 'max' | 'partner' | 'admin';

export interface Capability {
    feature: string;
    minTier: UserTier;
    model: string;
}

export const CAPABILITIES: Record<string, Capability> = {
    coach: { feature: 'AI Spiritual Coach', minTier: 'free', model: LITE_MODEL },
    devotional: { feature: 'Personalized Devotional', minTier: 'pro', model: LITE_MODEL },
    deepStudy: { feature: 'Deep Theological Study', minTier: 'max', model: PRO_MODEL },
    groundedPrayer: { feature: 'Grounded Prayer Topics', minTier: 'pro', model: FLASH_MODEL },
    quoteImage: { feature: 'AI Quote Image', minTier: 'pro', model: FLASH_MODEL },
    sanctuaryVideo: { feature: 'AI Cinematic Video', minTier: 'max', model: PRO_MODEL },
};

type CloudflareAiPayload = {
    feature: string;
    prompt: string;
    systemInstruction?: string;
    history?: Array<{ role: 'user' | 'assistant' | 'model'; text?: string; content?: string }>;
    model?: string;
    userId?: string;
    units?: number;
};

export const generateCloudflareText = async (payload: CloudflareAiPayload): Promise<string> => {
    const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || `AI request failed (${response.status})`);
    }

    const data = await response.json() as { text?: string };
    return data.text || '';
};

export const checkCapability = (feature: string, userTier: UserTier = 'free'): { allowed: boolean; message?: string } => {
    const capability = CAPABILITIES[feature];
    if (!capability) return { allowed: false, message: "Feature not found." };

    const tiers: UserTier[] = ['guest', 'free', 'pro', 'max', 'admin'];
    const userIndex = tiers.indexOf(userTier);
    const minIndex = tiers.indexOf(capability.minTier);

    console.log(`Checking capability: ${feature} for tier: ${userTier} (rank: ${userIndex}) vs min: ${capability.minTier} (rank: ${minIndex})`);

    if (userIndex < minIndex) {
        return { 
            allowed: false, 
            message: `This feature (${capability.feature}) is reserved for ${capability.minTier.toUpperCase()} members. Upgrade to unlock!` 
        };
    }

    return { allowed: true };
};

export const getAiCoachResponse = async (newMessage: string, history: Message[], userTier: UserTier = 'free', userId: string = 'anonymous'): Promise<string> => {
    try {
        const capability = CAPABILITIES.coach;
        const aiHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            text: msg.text,
        }));

        return await generateCloudflareText({
            feature: 'coach',
            prompt: newMessage,
            history: aiHistory,
            model: capability.model,
            userId,
            units: 500,
            systemInstruction: "You are Kai, an empathetic AI Spiritual Coach.",
        });
    } catch (error) {
        console.error("Coach Error:", error);
        throw new Error("Coach failed.");
    }
};

/**
 * Uses the Cloudflare AI proxy for prayer prompts. Live web grounding is not
 * available in the free local preview, so the server returns responsible
 * fallback topics when Workers AI is not bound.
 */
export const getGroundedPrayerTopics = async (userTier: UserTier = 'free', userId: string = 'anonymous'): Promise<any[]> => {
    const { allowed, message } = checkCapability('groundedPrayer', userTier);
    if (!allowed) throw new Error(message);

    try {
        const text = await generateCloudflareText({
            feature: 'groundedPrayer',
            model: CAPABILITIES.groundedPrayer.model,
            userId,
            units: 1000,
            prompt: "List 3 significant prayer concerns for Christian professionals today. Return JSON array with title, uri, and snippet.",
            systemInstruction: "Return only a JSON array. Keep each item pastoral, specific, and responsible.",
        });
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Grounding Error:", e);
        return [];
    }
};

export const getDeepTheologicalInsight = async (question: string, userTier: UserTier = 'free', userId: string = 'anonymous'): Promise<string> => {
    const { allowed, message } = checkCapability('deepStudy', userTier);
    if (!allowed) throw new Error(message);

    try {
        return await generateCloudflareText({
            feature: 'deepStudy',
            model: CAPABILITIES.deepStudy.model,
            userId,
            units: 2000,
            prompt: question,
            systemInstruction: "You are a scholarly theologian providing balanced, deep insights into spiritual questions. Be compassionate yet rigorous."
        });
    } catch (e) {
        console.error("Reasoning Error:", e);
        throw new Error("Deep thinking failed.");
    }
};

export const generateQuoteImage = async (prompt: string, userTier: UserTier = 'free'): Promise<string> => {
    const { allowed, message } = checkCapability('quoteImage', userTier);
    if (!allowed) throw new Error(message);

    // Image generation is temporarily disabled to save costs.
    throw new Error("PREMIUM_FEATURE: AI Image generation is currently reserved for Pro members to ensure sustainable growth.");
};

export const generateTagsForNote = async (noteText: string): Promise<string[]> => {
    try {
        const text = await generateCloudflareText({
            feature: 'tags',
            model: LITE_MODEL,
            prompt: `Analyze this spiritual note and generate 3-5 short one-word tags. Return only a JSON array: "${noteText}"`,
            systemInstruction: "Return only a JSON array of strings.",
            units: 300,
        });
        const parsed = JSON.parse(text.trim());
        return Array.isArray(parsed) ? parsed.slice(0, 5).map(String) : ["Reflection"];
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
 * The "Refinery" for complex backend logic.
 * This now uses the Cloudflare/D1 journal service for user context and
 * sends generation through the Cloudflare Pages AI proxy.
 */
export const generatePersonalizedDevotional = async (userId: string, name: string, userTier: UserTier = 'free'): Promise<DevotionalOutput> => {
    const { allowed, message } = checkCapability('devotional', userTier);
    if (!allowed) throw new Error(message);

    try {
        const notesContext = (await listJournalEntries(userId))
            .slice(0, 5)
            .map(entry => entry.text)
            .join('\n');

        const prompt = `
        ## INSPIRATION THEME ##
        Base the core theme on the most recent articles from https://theccndaily.substack.com/.
        
        ## USER CONTEXT ##
        userName: ${name}
        userContext: ${notesContext || 'The user is seeking daily spiritual guidance and growth.'}
        `;

        const text = await generateCloudflareText({
            feature: 'devotional',
            model: CAPABILITIES.devotional.model,
            userId,
            units: 1500,
            prompt,
            systemInstruction: DEVOTIONAL_SYSTEM_INSTRUCTION,
        });

        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as DevotionalOutput;
    } catch (e) {
        console.error("Devotional Error:", e);
        throw new Error("Failed to generate personalized devotional.");
    }
};

/**
 * Long-running AI video remains gated until the production provider and budget
 * are explicitly approved.
 */
export const generateSanctuaryVideo = async (prompt: string, onProgress: (msg: string) => void, userTier: UserTier = 'free'): Promise<string> => {
    const { allowed, message } = checkCapability('sanctuaryVideo', userTier);
    if (!allowed) throw new Error(message);

    // Video generation is temporarily disabled to save costs.
    throw new Error("PREMIUM_FEATURE: AI Cinematic Video generation is currently reserved for Max members to ensure sustainable growth.");
};
