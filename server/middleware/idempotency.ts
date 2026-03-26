import type { Request, Response, NextFunction } from 'express';

const store = new Map<string, { status: 'processing' | 'completed'; response?: unknown }>();

export function withIdempotency(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['idempotency-key'] as string) || (req.headers['x-event-id'] as string);
  if (!key) return res.status(400).json({ error: 'Missing idempotency key' });

  const routeKey = `${req.path}:${key}`;
  const existing = store.get(routeKey);

  if (existing?.status === 'completed') {
    return res.status(200).json(existing.response);
  }

  store.set(routeKey, { status: 'processing' });

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    store.set(routeKey, { status: 'completed', response: body });
    return originalJson(body);
  }) as typeof res.json;

  next();
}
