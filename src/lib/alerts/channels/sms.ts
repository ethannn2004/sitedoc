/**
 * SMS alert channel via Twilio.
 * Returns the provider message SID on success, or null on failure.
 */
import twilio from "twilio";
import { logger } from "@/lib/logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }
  return twilio(accountSid, authToken);
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

export interface SmsSendResult {
  success: boolean;
  messageSid: string | null;
  error: string | null;
}

export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const client = getClient();

  if (!client) {
    logger.info("[SMS] Twilio not configured. Would have sent:", { to, body });
    return { success: false, messageSid: null, error: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    logger.info("[SMS] Sent successfully", { to, sid: message.sid });
    return { success: true, messageSid: message.sid, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[SMS] Failed to send", { to, error: errorMsg });
    return { success: false, messageSid: null, error: errorMsg };
  }
}
