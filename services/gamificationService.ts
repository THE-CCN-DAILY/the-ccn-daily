import type { PointEarningAction, UserStats } from '../types';

export interface CloudflareGamification {
  userId: string;
  stats: UserStats;
  unlockedAchievements: string[];
}

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

export const getGamification = async (userId: string): Promise<CloudflareGamification | null> => {
  const data = await requestJson<{ gamification: CloudflareGamification | null }>(
    `/api/users/${encodeURIComponent(userId)}/gamification`
  );
  return data.gamification;
};

export const dispatchGamificationAction = async (
  userId: string,
  actionId: PointEarningAction['id']
): Promise<CloudflareGamification | null> => {
  const data = await requestJson<{ gamification: CloudflareGamification | null }>(
    `/api/users/${encodeURIComponent(userId)}/gamification/events`,
    {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    }
  );
  return data.gamification;
};

export const redeemGamificationReward = async (
  userId: string,
  cost: number
): Promise<CloudflareGamification | null> => {
  const data = await requestJson<{ gamification: CloudflareGamification | null }>(
    `/api/users/${encodeURIComponent(userId)}/gamification/redeem`,
    {
      method: 'POST',
      body: JSON.stringify({ cost }),
    }
  );
  return data.gamification;
};
