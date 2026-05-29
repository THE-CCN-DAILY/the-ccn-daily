import { adminAuthHeaders } from './adminAuth';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration?: string;
  sourceType?: string;
  startDate: string;
  coverUrl?: string;
  participantsCount: number;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface ChallengeModule {
  id: string;
  challengeId?: string;
  title: string;
  description: string;
  content: string;
  dayNumber: number;
  videoUrl?: string;
  audioUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  completedModules: string[];
  joinedAt?: string;
  updatedAt?: string;
}

const ADMIN_EMAIL = 'pastor.eryeza@gmail.com';

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
};

// Admin requests authenticate with the signed-in user's Firebase ID token (see ./adminAuth).

export const listChallenges = async (includeDrafts = false): Promise<Challenge[]> => {
  const data = await requestJson<{ challenges: Challenge[] }>(
    `/api/challenges${includeDrafts ? '?includeDrafts=true' : ''}`
  );
  return data.challenges;
};

export const getChallengeDetail = async (challengeId: string, userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<{
    challenge: Challenge;
    modules: ChallengeModule[];
    participant: ChallengeParticipant | null;
  }>(`/api/challenges/${encodeURIComponent(challengeId)}${query}`);
};

export const getChallengeModule = async (challengeId: string, moduleId: string, userId?: string) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestJson<{ module: ChallengeModule; completed: boolean }>(
    `/api/challenges/${encodeURIComponent(challengeId)}/modules/${encodeURIComponent(moduleId)}${query}`
  );
};

export const joinChallenge = async (challengeId: string, userId: string) => {
  return requestJson<{ challenge: Challenge | null; participant: ChallengeParticipant | null }>(
    `/api/challenges/${encodeURIComponent(challengeId)}/participants`,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }
  );
};

export const completeChallengeModule = async (challengeId: string, moduleId: string, userId: string) => {
  return requestJson<{ participant: ChallengeParticipant | null }>(
    `/api/challenges/${encodeURIComponent(challengeId)}/modules/${encodeURIComponent(moduleId)}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }
  );
};

export const publishChallenge = async (challenge: Partial<Challenge> & {
  title: string;
  description: string;
  curriculum?: Array<Record<string, unknown>>;
  tasks?: string[];
}) => {
  return requestJson<{ challenge: Challenge | null }>('/api/admin/challenges', {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(challenge),
  });
};

export const listChallengeModules = async (challengeId: string): Promise<ChallengeModule[]> => {
  const data = await requestJson<{ modules: ChallengeModule[] }>(
    `/api/challenges/${encodeURIComponent(challengeId)}/modules`
  );
  return data.modules;
};

export const saveChallengeModule = async (
  challengeId: string,
  module: Pick<ChallengeModule, 'title' | 'description' | 'content' | 'dayNumber'> &
    Partial<Pick<ChallengeModule, 'id' | 'videoUrl' | 'audioUrl'>>
) => {
  return requestJson<{ module: ChallengeModule | null }>(
    `/api/admin/challenges/${encodeURIComponent(challengeId)}/modules`,
    {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify(module),
    }
  );
};

export const deleteChallengeModule = async (challengeId: string, moduleId: string): Promise<void> => {
  await requestJson<{ ok: true }>(
    `/api/admin/challenges/${encodeURIComponent(challengeId)}/modules/${encodeURIComponent(moduleId)}`,
    {
      method: 'DELETE',
      headers: await adminAuthHeaders(),
    }
  );
};
