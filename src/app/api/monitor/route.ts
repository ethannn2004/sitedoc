import { NextRequest, NextResponse } from "next/server";
import { checkAllSites } from "@/lib/monitor";
import { logger } from "@/lib/logger";

/**
 * POST /api/monitor
 *
 * Cron-compatible endpoint that checks all monitored sites.
 * Protected by a shared secret to prevent unauthorized calls.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Always require CRON_SECRET in production
  if (!cronSecret && process.env.NODE_ENV === "production") {
    logger.error("CRON_SECRET is not set in production");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Unauthorized cron attempt", {
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("Starting scheduled monitoring check");
    const results = await checkAllSites();
    const downCount = results.filter((r) => "status" in r && r.status !== "online").length;
    logger.info("Monitoring check completed", { checked: results.length, down: downCount });

    return NextResponse.json({
      success: true,
      checked: results.length,
      results,
    });
  } catch (error) {
    logger.error("Cron monitoring check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Monitoring check failed." },
      { status: 500 }
    );
  }
}
