import type { AnalyticsEvent } from '../utils/analytics/schema';
import { listReleases } from './releaseController';

export async function trackAnalyticsEvent(event: AnalyticsEvent) {
  // Inject active release context
  const activeReleases = listReleases()
    .filter(r => r.status === 'running' || r.status === 'paused')
    .map(r => ({ key: r.featureKey, stage: r.currentStage, status: r.status }));

  const enrichedEvent = {
    ...event,
    meta: {
      ...event.meta,
      _releases: activeReleases,
    },
  };

  // TODO: replace with PostHog/Segment/Firebase/etc
  console.log('[analytics]', enrichedEvent.name, enrichedEvent);

  // Optional: write to backend endpoint
  // await fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(enrichedEvent) });
}

export function nowIso() {
  return new Date().toISOString();
}
