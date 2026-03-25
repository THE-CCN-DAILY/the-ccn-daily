# Project Phoenix: Monetization & Tier Strategy

## The Core Philosophy
As a devotional app, the primary mission is spiritual growth and accessibility. The Gospel and daily bread must remain free. Monetization should never gatekeep basic spiritual nourishment; instead, it should charge for **deep personalization, advanced AI compute, and immersive multimodal experiences.**

## The "Swarm" Analysis
*   **Ministry Perspective:** "Do not paywall the Word." Daily devotionals, community prayer, and basic teachings must be accessible to anyone seeking them, even anonymously.
*   **Product Perspective:** Guests need enough value to want to register. Free users need habits (streaks, journals) to stick around. Paid users need tools that save them time or provide profound, personalized insights.
*   **Technical/Cost Perspective (AI):** 
    *   *Cheap:* Standard text retrieval, basic Gemini Flash text generation.
    *   *Moderate:* Gemini Pro reasoning, Text-to-Speech (Audio narration).
    *   *Expensive:* Image Generation (Quote graphics), Gemini Live (Real-time voice), Veo (Video generation), Mux Video hosting.

---

## The Tier Breakdown

### 1. Guest (Non-Registered)
**Goal:** Discovery & Evangelism. Zero friction to experience the ministry, but with a strong hook to capture their email.
*   **The "Leak" Fix:** We cannot give away the farm without a way to follow up. Guests get a "taste" of the content.
*   **Content:** Read the public newsletter (evangelism). **Cannot** read the full daily devotional without signing up.
*   **Media:** Watch/listen to public podcasts and live streams (Sunday Gatherings).
*   **Resources:** Cannot access the free resource library without an account.
*   **Commerce:** Can donate to the ministry, purchase a-la-carte resources, or gift resources to others.
*   **Limitations:** No progress tracking, no journaling, no AI interaction, no community posting.

### 2. Free Member (Registered)
**Goal:** Habit Formation & Community Engagement.
*   **Everything in Guest, plus:**
*   **The Devotional (Base Personalization):** The server generates a single "Base Devotional" from the newsletter each day. When a free user logs in, the app simply inserts their `[Name]` into the text. This costs $0.00 in AI compute per user.
*   **Personalization:** Profile creation, progress tracking, streaks, and badges.
*   **Journaling:** Basic rich-text journaling (saved to cloud).
*   **Community:** Full access to the Prayer Wall (post, pray for others, verify testimonies).
*   **Basic AI (Kai):** Text-based AI Coach using cost-effective models (Gemini Flash). Limited to a generous daily quota (e.g., 10 messages/day).
*   **Sanctuary:** Standard prayer timer with static ambient music.
*   **Courses:** Access to enrolled free courses.
*   **Commerce:** Can donate, purchase a-la-carte resources, or gift resources to others.

### 3. Pro Tier (Suggested: $7.99/mo USD)
**Goal:** Deep Personalization & Enhanced Study.
*   **Everything in Free, plus:**
*   **The Devotional (Deep Personalization):** The server takes the "Base Devotional" and the user's recent journal entries/prayers, sending them to Gemini Pro. The AI rewrites the devotional to specifically address the user's current life season. (Costs ~$0.005 per user/day).
*   **Unlimited AI Coach:** Uncapped text interactions with Kai, utilizing deep theological reasoning (Gemini Pro).
*   **Generative Content:** Unlock the AI Quote Image Generator to create shareable graphics from scripture or devotionals.
*   **Premium Audio:** High-quality AI Voice Narration for all devotionals, articles, and books.
*   **Advanced Sanctuary:** Adaptive AI Music (Lyria) that shifts based on the user's mood and prayer focus.
*   **Premium Courses:** Access to the full library of standard courses and resources.
*   **Commerce:** Can donate, purchase a-la-carte resources, or gift resources to others.

### 4. Max Tier (Suggested: $14.99/mo USD)
**Goal:** The Sentient & Immersive Experience + Leadership.
*   **Everything in Pro, plus:**
*   **Gemini Live Voice Companion:** Real-time, low-latency spoken prayer and guidance. Users can literally speak to Kai and hear responses in real-time.
*   **Veo Cinematic Sanctuaries:** Generative, high-fidelity video backgrounds tailored to the theme of the user's current devotional.
*   **Grounded Intercession:** AI fetches real-time global news and humanitarian crises to generate dynamic, real-world prayer prompts.
*   **Family/Small Group Sharing:** The ability to "gift" or share premium content access with a small group (e.g., up to 5 people).
*   **Exclusive Masterclasses:** Access to live Q&A sessions, deep-dive theological masterclasses, and early access to new features.
*   **Commerce:** Can donate, purchase a-la-carte resources, or gift resources to others.

---

## Pricing & Purchasing Power Parity (PPP)
To ensure the app is globally accessible while remaining financially sustainable, we implement a **Purchasing Power Parity (PPP)** model. 

*   **Base Pricing (USD):** Pro ($7.99/mo), Max ($14.99/mo).
*   **Tier 1 (100%):** US, UK, EU, Australia, Canada.
*   **Tier 2 (70%):** Eastern Europe, parts of South America.
*   **Tier 3 (50%):** Brazil, Mexico, South Africa.
*   **Tier 4 (30%):** India, Nigeria, Kenya, Philippines.

By detecting the user's location, the app automatically applies a discount multiplier to the base USD price, making the premium tiers affordable regardless of the local economy.

## A-La-Carte Commerce & Gifting
Subscriptions are not the only way to support the ministry or access content.
*   **Donations:** Any user (Guest, Free, Pro, Max) can make a one-time or recurring donation.
*   **A-La-Carte Purchases:** Users who do not want a subscription can purchase specific premium courses, books, or masterclasses individually.
*   **Gifting:** Any user can purchase a resource or a subscription (e.g., "1 Year of Pro") and generate a redemption code to gift to a friend or family member.
