import { createHash } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { ApiError, RateLimitApiError } from "@/server/http/errors";

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
  private lastPrunedAt = 0;

  constructor(
    readonly scope: string,
    readonly rule: RateLimitRule
  ) {}

  check(key: string, now = Date.now()): RateLimitResult {
    this.pruneExpired(now);

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

  size() {
    return this.buckets.size;
  }

  reset(key?: string) {
    if (key) {
      this.buckets.delete(key);
      return;
    }
    this.buckets.clear();
    this.lastPrunedAt = 0;
  }

  private pruneExpired(now: number) {
    const pruneEveryMs = Math.min(this.rule.windowMs, 60_000);
    if (now - this.lastPrunedAt < pruneEveryMs) {
      return;
    }

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
    this.lastPrunedAt = now;
  }
}

function shouldUseSharedStore(env: NodeJS.ProcessEnv = process.env) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production" || env.RATE_LIMIT_STORAGE === "postgres";
}

function hashRateLimitKey(scope: string, key: string) {
  return createHash("sha256").update(`${scope}\0${key}`).digest("hex");
}

async function checkSharedRateLimit(limiter: MemoryRateLimiter, key: string, now = Date.now()): Promise<RateLimitResult> {
  const windowStartMs = Math.floor(now / limiter.rule.windowMs) * limiter.rule.windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + limiter.rule.windowMs);
  const keyHash = hashRateLimitKey(limiter.scope, key);

  try {
    const counter = await prisma.rateLimitCounter.upsert({
      where: {
        scope_keyHash_windowStart: {
          scope: limiter.scope,
          keyHash,
          windowStart
        }
      },
      create: {
        scope: limiter.scope,
        keyHash,
        windowStart,
        count: 1,
        expiresAt: resetAt
      },
      update: { count: { increment: 1 } },
      select: { count: true }
    });

    return {
      allowed: counter.count <= limiter.rule.max,
      limit: limiter.rule.max,
      remaining: Math.max(0, limiter.rule.max - counter.count),
      resetAt
    };
  } catch {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Request protection is temporarily unavailable. Try again later.");
  }
}

export async function enforceRateLimit(limiter: MemoryRateLimiter, key: string) {
  const result = shouldUseSharedStore() ? await checkSharedRateLimit(limiter, key) : limiter.check(key);
  if (!result.allowed) {
    throw new RateLimitApiError("Too many requests. Try again later.");
  }
  return result;
}

export async function pruneExpiredRateLimits(now = new Date()) {
  return prisma.rateLimitCounter.deleteMany({ where: { expiresAt: { lte: now } } });
}

export const rateLimiters = {
  login: new MemoryRateLimiter("login", { windowMs: 15 * 60 * 1000, max: 10 }),
  twoFactor: new MemoryRateLimiter("two-factor", { windowMs: 10 * 60 * 1000, max: 8 }),
  booking: new MemoryRateLimiter("booking", { windowMs: 10 * 60 * 1000, max: 5 }),
  contact: new MemoryRateLimiter("contact", { windowMs: 10 * 60 * 1000, max: 5 }),
  conversation: new MemoryRateLimiter("conversation", { windowMs: 60 * 1000, max: 12 }),
  upload: new MemoryRateLimiter("upload", { windowMs: 10 * 60 * 1000, max: 20 }),
  ai: new MemoryRateLimiter("ai", { windowMs: 10 * 60 * 1000, max: 20 }),
  analytics: new MemoryRateLimiter("analytics", { windowMs: 60 * 1000, max: 60 })
};
