import { RateLimitApiError } from "@/server/http/errors";

export type RateLimitRule = {
  windowMs: number;
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly rule: RateLimitRule) {}

  check(key: string, now = Date.now()): RateLimitResult {
    const current = this.buckets.get(key);
    const resetAt = current && current.resetAt > now ? current.resetAt : now + this.rule.windowMs;
    const count = current && current.resetAt > now ? current.count + 1 : 1;

    this.buckets.set(key, { count, resetAt });

    return {
      allowed: count <= this.rule.max,
      limit: this.rule.max,
      remaining: Math.max(0, this.rule.max - count),
      resetAt: new Date(resetAt)
    };
  }

  reset(key?: string) {
    if (key) {
      this.buckets.delete(key);
      return;
    }
    this.buckets.clear();
  }
}

export function enforceRateLimit(limiter: MemoryRateLimiter, key: string) {
  const result = limiter.check(key);
  if (!result.allowed) {
    throw new RateLimitApiError("تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.");
  }
  return result;
}

export const rateLimiters = {
  login: new MemoryRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  twoFactor: new MemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 }),
  booking: new MemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 }),
  contact: new MemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 }),
  conversation: new MemoryRateLimiter({ windowMs: 60 * 1000, max: 12 }),
  upload: new MemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 }),
  ai: new MemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 }),
  analytics: new MemoryRateLimiter({ windowMs: 60 * 1000, max: 60 })
};
