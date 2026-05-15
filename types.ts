
// FIX: Replaced incorrect component code with actual type definitions.
import React from 'react';
import type { Theme } from './contexts/ThemeContext';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

// For AuthContext.tsx
export type FirebaseUser = User;
export type UserRoleType = 'admin' | 'lead_developer' | 'group_lead' | 'family_lead' | 'user';

export interface AppUser extends FirebaseUser {
  role: UserRoleType;
  tier?: import('./types/pricing').SubscriptionTier;
}

// For MasterPlan.tsx
export interface PlanTask {
  id: string;
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
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
  createdAt: Timestamp;
}

export interface ReaderSettings {
  fontFamily: 'font-serif' | 'font-sans' | 'font-mono';
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
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
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
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
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

export * from './types/pricing';
