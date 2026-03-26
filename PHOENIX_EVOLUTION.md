# Project Phoenix: Strategic Evolution & Cost Governance

## 1. Architecture: The Two-Plane Split
To separate the "Founder Command Center" from the "Member Sanctuary," we are moving to a dual-namespace route structure.

| Namespace | Purpose | Access |
|-----------|---------|--------|
| `/app/*` | Member Sanctuary (Prayer, Journal, Live) | Authenticated Users |
| `/studio/*` | Founder Command Center (Admin, Data, Stats) | Role: Admin |

## 2. AI Cost Governance (The 3-Lane Policy)
We will transition from "Pro-by-default" to a tiered routing strategy to ensure sustainability.

*   **Lane 1: Ultra-Low Cost** (`gemini-3.1-flash-lite-preview`)
    *   Used for: Daily devotionals, basic chat, journaling summaries.
    *   Cost Impact: ~80% reduction vs Pro.
*   **Lane 2: Balanced Quality** (`gemini-3-flash-preview`)
    *   Used for: Complex prayer analysis, search-grounded intercession.
*   **Lane 3: Premium Reasoning** (`gemini-3.1-pro-preview`)
    *   Used for: Deep Study (Theological reasoning), Max-tier exclusive insights.

## 3. Tier Differentiation (Value vs. Cost)
We are shifting the Pro/Max gap to focus on **Access & Usage** rather than just raw AI tokens.

### Pro Tier ($)
*   **AI Access**: Unlimited Lane 1 Chat, Daily Personalized Devotionals.
*   **Usage**: Unlimited Journaling, Premium Audio library.
*   **Social**: Full Prayer Wall access.

### Max Tier ($$)
*   **AI Access**: Gemini Live (Voice), Veo Video loops, Lane 3 Deep Study.
*   **Usage**: Multi-user/Family sharing (up to 5), Higher storage for media.
*   **Exclusive**: Live Event VIP access, Masterclass library.

## 4. Security Enforcement
*   **Server-Side Auth**: All `/api/*` routes will verify Firebase ID tokens.
*   **Route Guards**: React Router guards will prevent unauthorized rendering of Admin components.
