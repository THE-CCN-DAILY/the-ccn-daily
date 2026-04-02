export type AnalyticsEventName =
  | 'paywall_viewed'
  | 'paywall_variant_assigned'
  | 'plan_selected'
  | 'trial_started'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'cancellation_preview_viewed'
  | 'cancellation_completed'
  | 'entitlement_denied'
  | 'quota_warning_shown'
  | 'quota_blocked'
  | 'upgrade_cta_clicked';

export interface AnalyticsEvent<TMeta = Record<string, unknown>> {
  name: AnalyticsEventName;
  userId?: string | null;
  tier?: 'guest' | 'free' | 'pro' | 'max';
  route?: string;
  timestamp: string;
  experiments?: Record<string, string>;
  meta?: TMeta;
}
