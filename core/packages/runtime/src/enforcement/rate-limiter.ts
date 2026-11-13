/**
 * Per-agent sliding-window rate limiter used by the enforcement gate.
 *
 * Config (read on every call):
 *   AEGISORA_RATE_LIMIT_MAX        max calls per window per agent (default 100, 0 = disabled)
 *   AEGISORA_RATE_LIMIT_WINDOW_MS  window size in ms (default 60000)
 */

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  windowMs: number;
  retryAfterMs: number;
}

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_TRACKED_AGENTS = 10_000;

function readNonNegativeInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  check(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): RateLimitDecision {
    if (limit <= 0) {
      return { allowed: true, limit, windowMs, retryAfterMs: 0 };
    }

    const cutoff = now - windowMs;
    let stamps = this.hits.get(key);
    if (!stamps) {
      stamps = [];
      this.hits.set(key, stamps);
    }

    while (stamps.length > 0 && (stamps[0] as number) <= cutoff) {
      stamps.shift();
    }

    if (stamps.length >= limit) {
      const oldest = stamps[0] ?? now;
      return {
        allowed: false,
        limit,
        windowMs,
        retryAfterMs: Math.max(0, oldest + windowMs - now),
      };
    }

    stamps.push(now);
    if (this.hits.size > MAX_TRACKED_AGENTS) this.sweep(cutoff);
    return { allowed: true, limit, windowMs, retryAfterMs: 0 };
  }

  private sweep(cutoff: number): void {
    for (const [key, stamps] of this.hits) {
      const last = stamps[stamps.length - 1] ?? 0;
      if (stamps.length === 0 || last <= cutoff) this.hits.delete(key);
    }
  }
}

// One limiter per owner (gate instance), so gates never share counters.
const limiters = new WeakMap<object, SlidingWindowLimiter>();

export function checkAgentRateLimit(
  owner: object,
  agentId: string,
  now: number = Date.now(),
): RateLimitDecision {
  const limit = readNonNegativeInt("AEGISORA_RATE_LIMIT_MAX", DEFAULT_LIMIT);
  const windowMs =
    readNonNegativeInt("AEGISORA_RATE_LIMIT_WINDOW_MS", DEFAULT_WINDOW_MS) ||
    DEFAULT_WINDOW_MS;

  let limiter = limiters.get(owner);
  if (!limiter) {
    limiter = new SlidingWindowLimiter();
    limiters.set(owner, limiter);
  }
  return limiter.check(agentId, limit, windowMs, now);
}