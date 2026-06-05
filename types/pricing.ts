export type SubscriptionTier = 'guest' | 'free' | 'pro' | 'max' | 'partner';
export type LimitMode = 'hard' | 'soft';
export type BillingCycle = 'monthly' | 'yearly';

export interface QuotaPolicy {
  limit: number; // -1 for unlimited
  reset: 'daily' | 'monthly' | 'never';
  mode: LimitMode;
  overagePackEligible: boolean;
}

export interface TierPricing {
  monthlyUsd: number;
  yearlyUsd: number;
  annualSavingsPct?: number;
  featured?: boolean;
}

export interface TierFeatures {
  // Content Access
  canReadDailyDevotional: boolean;
  canReadNewsletter: boolean;
  canWatchPublicMedia: boolean; 
  canAccessFreeResources: boolean;
  canAccessPremiumCourses: boolean;
  canAccessExclusiveMasterclasses: boolean;
  
  // New Content Access Lanes
  canAccessAudiobooksStandard: boolean;
  canAccessAudiobooksPremium: boolean;
  canJoinChallenges: boolean;
  maxActiveChallenges: number;
  maxConcurrentCourses: number;

  // Commerce & Giving
  canDonate: boolean;
  canPurchaseALaCarte: boolean;
  canGiftContent: boolean;

  // Personalization & Community
  canTrackProgress: boolean;
  canJournal: boolean;
  canPostToPrayerWall: boolean;
  canSharePremiumContent: boolean;

  // AI & Compute
  aiCoachAccess: 'none' | 'basic' | 'unlimited';
  dailyAiMessageLimit: number; // Legacy, kept for compatibility
  canGeneratePersonalizedDevotionals: boolean;
  canGenerateQuoteImages: boolean;
  canUsePremiumAudioNarration: boolean;
  canUseAdaptiveMusic: boolean;
  canUseLiveVoiceCompanion: boolean;
  canUseGroundedIntercession: boolean;

  // Quotas Map
  quotas: {
    aiChatMessages: QuotaPolicy;
    personalizedDevotionals: QuotaPolicy;
    verseExplainers: QuotaPolicy;
    studyPlanGenerations: QuotaPolicy;
    quoteImageGenerations: QuotaPolicy;
    ttsMinutes: QuotaPolicy;
    courseSummaryGenerations: QuotaPolicy;
    audiobookAiCompanionPrompts: QuotaPolicy;
  };
}

export interface TierConfig {
  pricing: TierPricing;
  features: TierFeatures;
  cogsGuardrailUsdPerMonth: number;
  targetGrossMarginPct: number;
}

const DEFAULT_QUOTA: QuotaPolicy = { limit: 0, reset: 'daily', mode: 'hard', overagePackEligible: false };
const UNLIMITED_QUOTA: QuotaPolicy = { limit: -1, reset: 'never', mode: 'soft', overagePackEligible: false };

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  guest: {
    pricing: { monthlyUsd: 0, yearlyUsd: 0 },
    cogsGuardrailUsdPerMonth: 0,
    targetGrossMarginPct: 0,
    features: {
      canReadDailyDevotional: false,
      canReadNewsletter: true,
      canWatchPublicMedia: true,
      canAccessFreeResources: false,
      canAccessPremiumCourses: false,
      canAccessExclusiveMasterclasses: false,
      canAccessAudiobooksStandard: false,
      canAccessAudiobooksPremium: false,
      canJoinChallenges: false,
      maxActiveChallenges: 0,
      maxConcurrentCourses: 0,
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
      canUseLiveVoiceCompanion: false,
      canUseGroundedIntercession: false,
      quotas: {
        aiChatMessages: DEFAULT_QUOTA,
        personalizedDevotionals: DEFAULT_QUOTA,
        verseExplainers: DEFAULT_QUOTA,
        studyPlanGenerations: DEFAULT_QUOTA,
        quoteImageGenerations: DEFAULT_QUOTA,
        ttsMinutes: DEFAULT_QUOTA,
        courseSummaryGenerations: DEFAULT_QUOTA,
        audiobookAiCompanionPrompts: DEFAULT_QUOTA,
      }
    }
  },
  free: {
    pricing: { monthlyUsd: 0, yearlyUsd: 0 },
    cogsGuardrailUsdPerMonth: 0.5,
    targetGrossMarginPct: 0,
    features: {
      canReadDailyDevotional: true,
      canReadNewsletter: true,
      canWatchPublicMedia: true,
      canAccessFreeResources: true,
      canAccessPremiumCourses: false,
      canAccessExclusiveMasterclasses: false,
      canAccessAudiobooksStandard: true,
      canAccessAudiobooksPremium: false,
      canJoinChallenges: true,
      maxActiveChallenges: 1,
      maxConcurrentCourses: 1,
      canDonate: true,
      canPurchaseALaCarte: true,
      canGiftContent: true,
      canTrackProgress: true,
      canJournal: true,
      canPostToPrayerWall: true,
      canSharePremiumContent: false,
      aiCoachAccess: 'basic',
      dailyAiMessageLimit: 10,
      canGeneratePersonalizedDevotionals: false,
      canGenerateQuoteImages: false,
      canUsePremiumAudioNarration: false,
      canUseAdaptiveMusic: false,
      canUseLiveVoiceCompanion: false,
      canUseGroundedIntercession: false,
      quotas: {
        aiChatMessages: { limit: 10, reset: 'daily', mode: 'soft', overagePackEligible: true },
        personalizedDevotionals: DEFAULT_QUOTA,
        verseExplainers: { limit: 5, reset: 'daily', mode: 'soft', overagePackEligible: false },
        studyPlanGenerations: DEFAULT_QUOTA,
        quoteImageGenerations: DEFAULT_QUOTA,
        ttsMinutes: DEFAULT_QUOTA,
        courseSummaryGenerations: DEFAULT_QUOTA,
        audiobookAiCompanionPrompts: DEFAULT_QUOTA,
      }
    }
  },
  pro: {
    pricing: { monthlyUsd: 8.99, yearlyUsd: 59.99, featured: true },
    cogsGuardrailUsdPerMonth: 3.0,
    targetGrossMarginPct: 60,
    features: {
      canReadDailyDevotional: true,
      canReadNewsletter: true,
      canWatchPublicMedia: true,
      canAccessFreeResources: true,
      canAccessPremiumCourses: true,
      canAccessExclusiveMasterclasses: false,
      canAccessAudiobooksStandard: true,
      canAccessAudiobooksPremium: true,
      canJoinChallenges: true,
      maxActiveChallenges: 3,
      maxConcurrentCourses: 5,
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
      canUseLiveVoiceCompanion: false,
      canUseGroundedIntercession: false,
      quotas: {
        aiChatMessages: UNLIMITED_QUOTA,
        personalizedDevotionals: { limit: 31, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        verseExplainers: UNLIMITED_QUOTA,
        studyPlanGenerations: { limit: 2, reset: 'monthly', mode: 'hard', overagePackEligible: true },
        quoteImageGenerations: { limit: 10, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        ttsMinutes: { limit: 30, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        courseSummaryGenerations: { limit: 5, reset: 'monthly', mode: 'soft', overagePackEligible: false },
        audiobookAiCompanionPrompts: { limit: 50, reset: 'monthly', mode: 'soft', overagePackEligible: true },
      }
    }
  },
  max: {
    pricing: { monthlyUsd: 14.99, yearlyUsd: 129.99 },
    cogsGuardrailUsdPerMonth: 7.0,
    targetGrossMarginPct: 50,
    features: {
      canReadDailyDevotional: true,
      canReadNewsletter: true,
      canWatchPublicMedia: true,
      canAccessFreeResources: true,
      canAccessPremiumCourses: true,
      canAccessExclusiveMasterclasses: true,
      canAccessAudiobooksStandard: true,
      canAccessAudiobooksPremium: true,
      canJoinChallenges: true,
      maxActiveChallenges: 10,
      maxConcurrentCourses: -1,
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
      canUseLiveVoiceCompanion: true,
      canUseGroundedIntercession: true,
      quotas: {
        aiChatMessages: UNLIMITED_QUOTA,
        personalizedDevotionals: UNLIMITED_QUOTA,
        verseExplainers: UNLIMITED_QUOTA,
        studyPlanGenerations: { limit: 10, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        quoteImageGenerations: { limit: 50, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        ttsMinutes: { limit: 120, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        courseSummaryGenerations: UNLIMITED_QUOTA,
        audiobookAiCompanionPrompts: UNLIMITED_QUOTA,
      }
    }
  },
  partner: {
    pricing: { monthlyUsd: 24.99, yearlyUsd: 199.99 },
    cogsGuardrailUsdPerMonth: 12.0,
    targetGrossMarginPct: 50,
    features: {
      canReadDailyDevotional: true,
      canReadNewsletter: true,
      canWatchPublicMedia: true,
      canAccessFreeResources: true,
      canAccessPremiumCourses: true,
      canAccessExclusiveMasterclasses: true,
      canAccessAudiobooksStandard: true,
      canAccessAudiobooksPremium: true,
      canJoinChallenges: true,
      maxActiveChallenges: -1,
      maxConcurrentCourses: -1,
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
      canUseLiveVoiceCompanion: true,
      canUseGroundedIntercession: true,
      quotas: {
        aiChatMessages: UNLIMITED_QUOTA,
        personalizedDevotionals: UNLIMITED_QUOTA,
        verseExplainers: UNLIMITED_QUOTA,
        studyPlanGenerations: UNLIMITED_QUOTA,
        quoteImageGenerations: UNLIMITED_QUOTA,
        ttsMinutes: { limit: 300, reset: 'monthly', mode: 'soft', overagePackEligible: true },
        courseSummaryGenerations: UNLIMITED_QUOTA,
        audiobookAiCompanionPrompts: UNLIMITED_QUOTA,
      }
    }
  },
};

export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_CONFIGS[tier].features;
}

export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free': return 'Foundation';
    case 'pro': return 'Growth';
    case 'max': return 'Family';
    case 'partner': return 'Leader';
    case 'guest': return 'Guest';
    default: return 'Foundation';
  }
}
