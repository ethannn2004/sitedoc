/**
 * Unified alert dispatcher.
 * Routes alerts to the appropriate channel(s) based on user preferences.
 * Designed to be extended with email, Slack, WhatsApp, etc.
 */
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendSms } from "./channels/sms";
import {
  outageMessage,
  recoveryMessage,
  testMessage,
  type OutageAlertData,
  type RecoveryAlertData,
} from "./templates";

interface AlertTarget {
  userId: string;
  phone: string | null;
  smsAlertsEnabled: boolean;
}

/**
 * Send an outage alert through all enabled channels.
 * Logs the result to AlertLog for auditing.
 */
export async function sendOutageAlert(
  target: AlertTarget,
  incidentId: string,
  data: OutageAlertData
): Promise<boolean> {
  if (!target.smsAlertsEnabled || !target.phone) {
    logger.debug("[Alert] Skipping outage alert (disabled or no phone)", {
      userId: target.userId,
    });
    return false;
  }

  const body = outageMessage(data);
  const result = await sendSms(target.phone, body);

  // Log the alert attempt
  await prisma.alertLog.create({
    data: {
      incidentId,
      userId: target.userId,
      phone: target.phone,
      message: body,
      status: result.success ? "sent" : "failed",
      sentAt: new Date(),
    },
  });

  // Future: add email, Slack, etc. here
  // if (target.emailAlertsEnabled) await sendEmail(...)
  // if (target.slackWebhookUrl) await sendSlack(...)

  return result.success;
}

/**
 * Send a recovery alert through all enabled channels.
 */
export async function sendRecoveryNotification(
  target: AlertTarget,
  data: RecoveryAlertData
): Promise<boolean> {
  if (!target.smsAlertsEnabled || !target.phone) {
    return false;
  }

  const body = recoveryMessage(data);
  const result = await sendSms(target.phone, body);

  // Future: add email, Slack, etc. here

  return result.success;
}

/**
 * Send a test SMS to verify configuration.
 */
export async function sendTestAlert(phone: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const body = testMessage();
  const result = await sendSms(phone, body);
  return { success: result.success, error: result.error };
}
