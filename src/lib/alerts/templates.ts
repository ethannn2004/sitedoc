/**
 * Alert message templates.
 * Centralized here so all channels (SMS, email, Slack, etc.) share the same copy.
 */

export interface OutageAlertData {
  siteLabel: string;
  siteUrl: string;
  failureType: string;
  diagnosis: string;
  suggestedFix: string;
}

export interface RecoveryAlertData {
  siteLabel: string;
  siteUrl: string;
  recoveredAt: Date;
}

export function outageMessage(data: OutageAlertData): string {
  return [
    `SiteDoc Alert: ${data.siteLabel} (${data.siteUrl}) is DOWN.`,
    `Issue: ${data.failureType}.`,
    `Diagnosis: ${data.diagnosis}`,
    `Suggested fix: ${data.suggestedFix}`,
  ].join("\n");
}

export function recoveryMessage(data: RecoveryAlertData): string {
  const time = data.recoveredAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return [
    `SiteDoc Recovery: ${data.siteLabel} (${data.siteUrl}) is back ONLINE.`,
    `Recovered at: ${time}.`,
  ].join("\n");
}

export function testMessage(): string {
  return "SiteDoc Test: Your SMS alerts are configured correctly. You will receive alerts when your monitored sites go down.";
}
