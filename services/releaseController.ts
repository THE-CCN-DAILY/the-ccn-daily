export type RolloutStage = 0 | 5 | 20 | 50 | 100;
export type ReleaseStatus = 'running' | 'paused' | 'rolled_back' | 'completed';

export interface FeatureReleaseState {
  featureKey: string;
  owner: string;
  currentStage: RolloutStage;
  status: ReleaseStatus;
  startedAt: string;
  updatedAt: string;
  notes?: string;
}

const releaseStore = new Map<string, FeatureReleaseState>();

export function initRelease(featureKey: string, owner: string): FeatureReleaseState {
  const state: FeatureReleaseState = {
    featureKey,
    owner,
    currentStage: 0,
    status: 'running',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  releaseStore.set(featureKey, state);
  return state;
}

export function advanceRelease(featureKey: string): FeatureReleaseState | null {
  const state = releaseStore.get(featureKey);
  if (!state || state.status !== 'running') return state || null;

  const ladder: RolloutStage[] = [0, 5, 20, 50, 100];
  const idx = ladder.indexOf(state.currentStage);
  const next = ladder[Math.min(idx + 1, ladder.length - 1)];
  state.currentStage = next;
  state.updatedAt = new Date().toISOString();
  if (next === 100) state.status = 'completed';
  releaseStore.set(featureKey, state);
  return state;
}

export function setReleaseStatus(featureKey: string, status: ReleaseStatus, notes?: string) {
  const state = releaseStore.get(featureKey);
  if (!state) return null;
  state.status = status;
  state.notes = notes;
  state.updatedAt = new Date().toISOString();
  releaseStore.set(featureKey, state);
  return state;
}

export function getReleaseState(featureKey: string) {
  return releaseStore.get(featureKey) || null;
}

export function listReleases() {
  return Array.from(releaseStore.values());
}
