import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum time (ms) to wait for a response from the target site. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per IP and enforces a sliding window.
 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // max requests per window per IP
const ipRequestLog = new Map<string, number[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return `true` if `value` looks like a valid HTTP(S) URL. */
function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Block requests to private / internal network ranges. */
function isPrivateOrReserved(hostname: string): boolean {
  // Block localhost variants
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return true;
  }

  // Block common private IPv4 ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^0\.0\.0\.0$/,
    /^169\.254\.\d{1,3}\.\d{1,3}$/, // link-local
  ];

  return privateRanges.some((re) => re.test(hostname));
}

/**
 * Enforce a per-IP sliding-window rate limit.
 * Returns `true` if the request should be **blocked**.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) ?? [];

  // Remove entries outside the current window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  ipRequestLog.set(ip, recent);

  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

/** Classify fetch errors into human-readable categories. */
function classifyError(error: unknown): { message: string; code: string } {
  if (error instanceof TypeError) {
    const msg = (error as Error).message.toLowerCase();
    if (msg.includes("fetch failed") || msg.includes("dns")) {
      return { message: "DNS lookup failed or host is unreachable", code: "DNS_ERROR" };
    }
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return { message: `Request timed out after ${REQUEST_TIMEOUT_MS}ms`, code: "TIMEOUT" };
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return { message, code: "NETWORK_ERROR" };
}

// ---------------------------------------------------------------------------
// Route Handler  –  GET /api/check-site?url=https://example.com
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // --- Rate limiting -------------------------------------------------------
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  // --- Extract & validate URL ----------------------------------------------
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'Missing required query parameter "url".' },
      { status: 400 }
    );
  }

  if (!isValidHttpUrl(targetUrl)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid URL. Provide a full URL including http:// or https://.",
      },
      { status: 400 }
    );
  }

  // Block SSRF: prevent probing internal networks
  const { hostname } = new URL(targetUrl);
  if (isPrivateOrReserved(hostname)) {
    return NextResponse.json(
      { success: false, error: "Requests to private or internal addresses are not allowed." },
      { status: 403 }
    );
  }

  // --- Probe the target site -----------------------------------------------
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(targetUrl, {
      method: "HEAD", // lightweight – we only need headers
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "SiteDoc-StatusChecker/1.0",
      },
    });

    const responseTimeMs = Date.now() - start;

    return NextResponse.json({
      success: true,
      url: targetUrl,
      online: response.ok, // true for 2xx status codes
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - start;
    const { message, code } = classifyError(error);

    return NextResponse.json({
      success: true,
      url: targetUrl,
      online: false,
      statusCode: null,
      statusText: null,
      responseTimeMs,
      error: { code, message },
    });
  } finally {
    clearTimeout(timeout);
  }
}
