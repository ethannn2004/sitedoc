/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per key (user ID or IP).
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const requestLogs = new Map<string, number[]>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestLogs.entries()) {
      const recent = timestamps.filter((t) => now - t < 300_000);
      if (recent.length === 0) {
        requestLogs.delete(key);
      } else {
        requestLogs.set(key, recent);
      }
    }
  }, 300_000);
}

const DEFAULT_CONFIG: RateLimitConfig = { windowMs: 60_000, maxRequests: 60 };

export function isRateLimited(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  const now = Date.now();
  const timestamps = requestLogs.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < config.windowMs);
  recent.push(now);
  requestLogs.set(key, recent);
  return recent.length > config.maxRequests;
}
