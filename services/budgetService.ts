export interface UsageLog {
  userId: string;
  feature: string;
  model: string;
  tokens?: number;
  costEstimate?: number;
  timestamp: string;
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

export const trackAiUsage = async (
  userId: string,
  feature: string,
  model: string,
  tokens: number = 0
) => {
  try {
    await requestJson<{ ok: true }>('/api/ai/usage', {
      method: 'POST',
      body: JSON.stringify({ userId, feature, model, tokens }),
    });
  } catch {
    // Usage tracking is non-critical — silent failure is acceptable
  }
};

export const getUsageStats = async (days: number = 30) => {
  return requestJson<{
    totalCost: number;
    featureBreakdown: Record<string, number>;
    recentLogs: UsageLog[];
  }>(`/api/ai/usage?days=${encodeURIComponent(days)}`);
};
