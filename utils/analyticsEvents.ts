type EventName =
  | 'paywall_viewed'
  | 'resource_cta_clicked'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'cancellation_preview_viewed'
  | 'cancellation_completed'
  | 'entitlement_denied_reason';

export function trackEvent(event: EventName, payload: Record<string, unknown> = {}) {
  // TODO: wire to your analytics provider (PostHog, Firebase, etc.)
  console.log('[analytics]', event, payload);
}
