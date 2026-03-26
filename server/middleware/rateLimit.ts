import type { Request, Response, NextFunction } from 'express';

const bucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = bucket.get(key);

    if (!current || now > current.resetAt) {
      bucket.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (current.count >= opts.max) {
      const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfterSec });
    }

    current.count += 1;
    bucket.set(key, current);
    next();
  };
}
