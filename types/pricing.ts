export type SubscriptionTier = 'guest' | 'free' | 'pro' | 'max';

export interface TierFeatures {
  // Content Access
  canReadDailyDevotional: boolean; // Guests cannot read the full devotional without signing up
  canReadNewsletter: boolean;
  canWatchPublicMedia: boolean; 
  canAccessFreeResources: boolean;
  canAccessPremiumCourses: boolean;
  canAccessExclusiveMasterclasses: boolean;

  // Commerce & Giving
  canDonate: boolean;
  canPurchaseALaCarte: boolean; // Buy specific courses/books without a subscription
  canGiftContent: boolean; // Buy for someone else

  // Personalization & Community
  canTrackProgress: boolean; // Streaks, Badges
  canJournal: boolean;
  canPostToPrayerWall: boolean;
  canSharePremiumContent: boolean; // Family/Small Group Sharing

  // AI & Compute (The Cost Drivers)
  aiCoachAccess: 'none' | 'basic' | 'unlimited'; // basic = Flash, unlimited = Pro
  dailyAiMessageLimit: number; // 0 for none, -1 for unlimited
  canGeneratePersonalizedDevotionals: boolean;
  canGenerateQuoteImages: boolean;
  canUsePremiumAudioNarration: boolean;
  canUseAdaptiveMusic: boolean; // Lyria
  canUseGeminiLiveVoice: boolean; // Real-time spoken prayer
  canUseVeoCinematicBackgrounds: boolean; // Generative video
  canUseGroundedIntercession: boolean; // Real-time news for prayer
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierFeatures> = {
  guest: {
    canReadDailyDevotional: false, // GATED: Must sign up to read the daily devotional
    canReadNewsletter: true, // Public evangelism
    canWatchPublicMedia: true,
    canAccessFreeResources: false, // GATED: Must sign up to access library
    canAccessPremiumCourses: false,
    canAccessExclusiveMasterclasses: false,
    canDonate: true,
    canPurchaseALaCarte: true,
    canGiftContent: true,
    canTrackProgress: false,
    canJournal: false,
    canPostToPrayerWall: false,
    canSharePremiumContent: false,
    aiCoachAccess: 'none',
    dailyAiMessageLimit: 0,
    canGeneratePersonalizedDevotionals: false,
    canGenerateQuoteImages: false,
    canUsePremiumAudioNarration: false,
    canUseAdaptiveMusic: false,
    canUseGeminiLiveVoice: false,
    canUseVeoCinematicBackgrounds: false,
    canUseGroundedIntercession: false,
  },
  free: {
    canReadDailyDevotional: true, // Gets the Base Devotional + Name insertion
    canReadNewsletter: true,
    canWatchPublicMedia: true,
    canAccessFreeResources: true,
    canAccessPremiumCourses: false,
    canAccessExclusiveMasterclasses: false,
    canDonate: true,
    canPurchaseALaCarte: true,
    canGiftContent: true,
    canTrackProgress: true,
    canJournal: true,
    canPostToPrayerWall: true,
    canSharePremiumContent: false,
    aiCoachAccess: 'basic',
    dailyAiMessageLimit: 10, // Generous free tier for AI chat
    canGeneratePersonalizedDevotionals: false,
    canGenerateQuoteImages: false,
    canUsePremiumAudioNarration: false,
    canUseAdaptiveMusic: false,
    canUseGeminiLiveVoice: false,
    canUseVeoCinematicBackgrounds: false,
    canUseGroundedIntercession: false,
  },
  pro: {
    canReadDailyDevotional: true, // Gets the Deeply Personalized AI Devotional
    canReadNewsletter: true,
    canWatchPublicMedia: true,
    canAccessFreeResources: true,
    canAccessPremiumCourses: true,
    canAccessExclusiveMasterclasses: false,
    canDonate: true,
    canPurchaseALaCarte: true,
    canGiftContent: true,
    canTrackProgress: true,
    canJournal: true,
    canPostToPrayerWall: true,
    canSharePremiumContent: false,
    aiCoachAccess: 'unlimited',
    dailyAiMessageLimit: -1,
    canGeneratePersonalizedDevotionals: true,
    canGenerateQuoteImages: true,
    canUsePremiumAudioNarration: true,
    canUseAdaptiveMusic: true,
    canUseGeminiLiveVoice: false,
    canUseVeoCinematicBackgrounds: false,
    canUseGroundedIntercession: false,
  },
  max: {
    canReadDailyDevotional: true,
    canReadNewsletter: true,
    canWatchPublicMedia: true,
    canAccessFreeResources: true,
    canAccessPremiumCourses: true,
    canAccessExclusiveMasterclasses: true,
    canDonate: true,
    canPurchaseALaCarte: true,
    canGiftContent: true,
    canTrackProgress: true,
    canJournal: true,
    canPostToPrayerWall: true,
    canSharePremiumContent: true,
    aiCoachAccess: 'unlimited',
    dailyAiMessageLimit: -1,
    canGeneratePersonalizedDevotionals: true,
    canGenerateQuoteImages: true,
    canUsePremiumAudioNarration: true,
    canUseAdaptiveMusic: true,
    canUseGeminiLiveVoice: true,
    canUseVeoCinematicBackgrounds: true,
    canUseGroundedIntercession: true,
  },
};
