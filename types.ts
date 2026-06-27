
import React from 'react';
import type { Theme } from './contexts/ThemeContext';

export type UserRoleType = 'admin' | 'lead_developer' | 'developer' | 'editor' | 'community_moderator' | 'group_lead' | 'family_lead' | 'user';

export interface AppUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
  role: UserRoleType;
  tier?: import('./types/pricing').SubscriptionTier;
}

// For MasterPlan.tsx
export interface PlanTask {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  status?: 'Completed' | 'In Progress' | 'Planned';
}

export interface PlanPhase {
  id: string;
  title: string;
  description: string;
  tasks: PlanTask[];
  progress: number;
}

// For Team.tsx
export interface TeamMember {
  name: string;
  role: string;
  avatarUrl: string;
  focus: string;
}

// For NextSteps.tsx
export interface NextStepItem {
  id:string;
  text: string;
  isCompleted: boolean;
}

// For DataArchitecture.tsx
export interface FirestoreField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'timestamp' | 'reference' | 'array' | 'map';
  description: string;
}

export interface FirestoreCollection {
  name: string;
  description: string;
  fields: FirestoreField[];
  subcollections?: FirestoreCollection[];
}

// For Roles.tsx
export interface UserRole {
  name:string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  permissions: string[];
}

// For ReaderPrototype.tsx and related components
export interface Highlight {
  id: string; // Firestore document ID
  contentId: string; // e.g., 'epub-1' or 'devotional-2024-07-26'
  text: string;
  note?: string;
  voiceNoteUrl?: string;
  tags?: string[];
  color: 'yellow' | 'blue' | 'green' | 'pink';
  createdAt: string;
}

export interface ReaderSettings {
  fontFamily: 'font-serif' | 'font-sans' | 'font-readable';
  fontSize: number; // This is an index for an array of sizes
  lineSpacing: 'tight' | 'normal' | 'relaxed' | 'loose';
  theme: Theme;
  margins: 'normal' | 'wide';
  narratorVoice: 'Zephyr' | 'Nova' | 'Kore';
}

// For PodcastPage.tsx and AudioPlayerContext.tsx
export interface PodcastEpisode {
  id: string | number;
  title: string;
  description: string;
  author: string;
  duration: number;
  coverArt: string;
  releaseDate: string;
  audioUrl: string;
  isFeatured?: boolean;
  // New fields for immersive player features
  summary?: string;
  keyTakeaways?: string[];
  transcript?: { time: number; text: string }[];
  chapters?: { time: number; title: string }[];
}

// For AI-Powered Thematic Search in PodcastPage.tsx
export type SearchResult = PodcastEpisode & {
    contextSnippet: string;
};

// For DevotionalGeneratorPage.tsx
export interface DevotionalOutput {
    title: string;
    openingVerse: string;
    body: string;
    prayer: string;
    declaration: string;
    furtherStudy: string[];
}

// For PrayerWall.tsx and TestimoniesPage.tsx
export interface PrayerRequest {
    id: number;
    text: string;
    author: string; // "Anonymous" or a name
    prayerCount: number;
    isUserSubmitted?: boolean;
    testimony?: string;
}

export interface StandaloneTestimony {
    id: number;
    author: string;
    title: string;
    text: string;
}

// For Comments on content
export interface Comment {
    id: string;
    author: string;
    avatar: string;
    text: string;
    timestamp: string; // e.g., "2 hours ago"
}

// For GamificationPage.tsx
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    points: number;
    isUnlocked: boolean;
}

export interface UserStats {
    currentStreak: number;
    longestStreak: number;
    points: number;
}

export interface RewardItem {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    cost: number;
    type: 'content' | 'theme' | 'badge';
}

export interface PointEarningAction {
    id: string;
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    points: number;
}

// For Dynamic Theming and Atmospheric Music
export type Mood = 'Reflective' | 'Joyful' | 'Hopeful' | 'Courageous';

// For BibleReaderPage.tsx
export interface BibleChapter {
    book: string;
    chapter: number;
    content: string;
}

export interface BibleBook {
    name: string;
    chapters: number;
    testament: 'OT' | 'NT';
}

export interface BibleSearchResult {
    book: string;
    chapter: number;
    contextSnippet: string;
}

// For AiCoachPage.tsx
export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// For Quote Generator Suite
export interface QuoteGraphic {
  id: string;
  text: string;
  attribution: string;
  imageUrl: string;
  style: string;
}

// ─── Book System ────────────────────────────────────────────────────────────

export type BookVariantType = 'ebook' | 'audiobook' | 'print' | 'translation';
export type PrintFormat = 'paperback' | 'hardcover';
export type EbookFormat = 'epub' | 'pdf';

export interface BookVariant {
  id: string;
  type: BookVariantType;
  // Translation fields
  language?: string;        // ISO 639-1: 'sw', 'fr', 'es', 'lg', 'rw', etc.
  languageName?: string;    // Display: 'Swahili', 'French', 'Luganda'
  // Digital file fields
  format?: EbookFormat | 'mp3';
  fileUrl?: string;         // Hosted file URL for ebooks/audiobooks
  // Print fields
  printFormat?: PrintFormat;
  region?: string;          // 'Global', 'Africa', 'North America', 'Europe', etc.
  // Pricing
  price?: number;
  currency?: string;        // ISO 4217: 'USD', 'UGX', 'GBP', etc.
  isFree: boolean;
  // External purchase
  purchaseUrl?: string;
}

export type PodPlatformId =
  | 'amazon_kdp' | 'apple_books' | 'google_play' | 'kobo'
  | 'barnes_noble' | 'draft2digital' | 'smashwords' | 'lulu'
  | 'ingramspark' | 'bookbaby' | 'custom';

export interface BookPurchaseLink {
  id: string;
  platform: PodPlatformId;
  name: string;       // For 'custom' platforms or display override
  url: string;
  region?: string;    // e.g., 'Global', 'Africa', 'US Only'
  logoUrl?: string;   // For custom platforms
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  coverUrl?: string;
  description: string;
  isbn?: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published';
  variants: BookVariant[];
  purchaseLinks: BookPurchaseLink[];
  /** Admin-settable external marketplace review links, keyed by platform. */
  reviewLinks?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Reading Plans ───────────────────────────────────────────────────────────

export interface ReadingPlanItem {
  day: number;           // Day 1, 2, 3, etc. in the plan
  title: string;
  description?: string;
  bookId?: string;       // Reference to a Book
  bookTitle?: string;    // Denormalized for display
  chapters?: string;     // e.g., "Genesis 1-3" or "Chapter 1-2"
  contentHtml?: string;  // Direct HTML content for non-book passages
  durationMinutes?: number;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  category: string;       // e.g., 'Bible Study', 'Book Club', 'Devotional'
  totalDays: number;
  isPremium: boolean;
  isFree: boolean;
  status: 'draft' | 'published';
  items: ReadingPlanItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Podcast System ─────────────────────────────────────────────────────────

export interface PodcastEpisodeDoc {
  id: string;
  showName: string;
  episodeTitle: string;
  episodeNumber?: number;
  description?: string;
  audioUrl?: string;
  coverUrl?: string;
  duration?: string;
  publishDate?: string;
  isPremium: boolean;
  rssFeedUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Newsletter System ───────────────────────────────────────────────────────

export interface NewsletterIssueDoc {
  id: string;
  seriesName: string;
  issueTitle: string;
  issueNumber?: number;
  description?: string;
  publishDate?: string;
  archiveUrl?: string;
  coverUrl?: string;
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export * from './types/pricing';

// ─── Prayer Circle ────────────────────────────────────────────────────────────

export interface PrayerPerson {
  id: string;
  name: string;
  relationship: string; // e.g. 'Spouse', 'Parent', 'Friend', 'Colleague'
  notes: string;
  prayerPoints: string[];
  photoUrl?: string;
  lastPrayedDate?: string; // ISO date string 'YYYY-MM-DD'
  createdAt: string;
}
