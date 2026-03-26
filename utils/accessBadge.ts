import type { Resource } from '../types/entitlements';

export function getAccessBadge(resource: Resource) {
  switch (resource.accessLane) {
    case 'included': return { label: 'Included in Subscription', tone: 'info' as const };
    case 'owned': return { label: 'Own Forever', tone: 'success' as const };
    case 'hybrid': return { label: 'Included or Buy Once', tone: 'accent' as const };
  }
}
