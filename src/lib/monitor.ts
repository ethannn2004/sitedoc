import { prisma } from "./db";
import { logger } from "./logger";
import { diagnoseFailure } from "./diagnosis";
import { sendOutageAlert, sendRecoveryNotification } from "./alerts";
import type { MonitoredSite, User } from "@/generated/prisma/client";

const REQUEST_TIMEOUT_MS = 10_000;

interface CheckOutput {
  status: string;
  statusCode: number | null;
  responseTimeMs: number;
  errorCode: string | null;
  errorMessage: string | null;
  diagnosis: string | null;
  suggestedFix: string | null;
  checkedAt: Date;
}

function classifyError(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("abort") || msg.includes("timeout")) {
      return { code: "TIMEOUT", message: `Request timed out after ${REQUEST_TIMEOUT_MS}ms` };
    }
    if (msg.includes("dns") || msg.includes("enotfound") || msg.includes("getaddrinfo")) {
      return { code: "DNS_ERROR", message: "DNS lookup failed or host is unreachable" };
    }
    if (msg.includes("ssl") || msg.includes("cert") || msg.includes("tls")) {
      return { code: "SSL_ERROR", message: "SSL/TLS certificate error" };
    }
    if (msg.includes("econnrefused") || msg.includes("connection refused")) {
      return { code: "ECONNREFUSED", message: "Connection refused by server" };
    }
    if (msg.includes("econnreset") || msg.includes("connection reset")) {
      return { code: "ECONNRESET", message: "Connection was reset" };
    }

    return { code: "NETWORK_ERROR", message: error.message };
  }

  return { code: "NETWORK_ERROR", message: "Unknown error" };
}

export async function checkSite(
  site: MonitoredSite & { user: User }
): Promise<CheckOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();
  const now = new Date();

  let status: string;
  let statusCode: number | null = null;
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let diagnosis: string | null = null;
  let suggestedFix: string | null = null;

  try {
    const response = await fetch(site.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SiteDoc-Monitor/1.0" },
    });

    statusCode = response.status;

    if (response.ok) {
      status = "online";
    } else {
      const diag = diagnoseFailure(null, statusCode);
      status = diag.type;
      diagnosis = diag.diagnosis;
      suggestedFix = diag.suggestedFix;
    }
  } catch (error) {
    const classified = classifyError(error);
    errorCode = classified.code;
    errorMessage = classified.message;
    const diag = diagnoseFailure(classified.code, null);
    status = diag.type;
    diagnosis = diag.diagnosis;
    suggestedFix = diag.suggestedFix;
  } finally {
    clearTimeout(timeout);
  }

  const responseTimeMs = Date.now() - start;

  // Save check result
  await prisma.checkResult.create({
    data: {
      siteId: site.id,
      status,
      statusCode,
      responseTimeMs,
      errorCode,
      errorMessage,
      checkedAt: now,
    },
  });

  const previousStatus = site.status;

  // Update site record
  await prisma.monitoredSite.update({
    where: { id: site.id },
    data: {
      status,
      responseTimeMs,
      lastCheckedAt: now,
      lastErrorCode: errorCode,
      lastDiagnosis: diagnosis,
      lastSuggestion: suggestedFix,
    },
  });

  // Handle state transitions for alerting
  const wasOnline = previousStatus === "online" || previousStatus === "unknown";
  const isNowDown = status !== "online";
  const isNowOnline = status === "online";
  const wasDown = previousStatus !== "online" && previousStatus !== "unknown";

  // DOWN transition: create incident + send alert
  if (wasOnline && isNowDown && diagnosis) {
    const incident = await prisma.incident.create({
      data: {
        siteId: site.id,
        type: status,
        diagnosis,
        suggestedFix: suggestedFix || "Investigate the server logs.",
        startedAt: now,
      },
    });

    await sendOutageAlert(
      {
        userId: site.user.id,
        phone: site.user.phone,
        smsAlertsEnabled: site.user.smsAlertsEnabled,
      },
      incident.id,
      {
        siteLabel: site.label,
        siteUrl: site.url,
        failureType: status,
        diagnosis,
        suggestedFix: suggestedFix || "Investigate the server logs.",
      }
    );
  }

  // RECOVERY transition: resolve incident + send recovery alert
  if (wasDown && isNowOnline) {
    const openIncidents = await prisma.incident.findMany({
      where: { siteId: site.id, resolvedAt: null },
    });

    for (const incident of openIncidents) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { resolvedAt: now },
      });
    }

    await sendRecoveryNotification(
      {
        userId: site.user.id,
        phone: site.user.phone,
        smsAlertsEnabled: site.user.smsAlertsEnabled,
      },
      { siteLabel: site.label, siteUrl: site.url, recoveredAt: now }
    );
  }

  return {
    status,
    statusCode,
    responseTimeMs,
    errorCode,
    errorMessage,
    diagnosis,
    suggestedFix,
    checkedAt: now,
  };
}

/** Check all monitored sites. Called by the cron endpoint. */
export async function checkAllSites() {
  const sites = await prisma.monitoredSite.findMany({
    include: { user: true },
  });

  const results = [];

  for (const site of sites) {
    try {
      const result = await checkSite(site);
      results.push({ siteId: site.id, url: site.url, ...result });
    } catch (error) {
      logger.error("Failed to check site", { url: site.url, error: String(error) });
      results.push({ siteId: site.id, url: site.url, error: String(error) });
    }
  }

  return results;
}
