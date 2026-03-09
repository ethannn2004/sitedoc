/**
 * Environment variable validation.
 * Called once at startup to fail fast if required vars are missing.
 */

const requiredInProduction = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "CRON_SECRET",
] as const;

const optionalVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  const isProduction = process.env.NODE_ENV === "production";
  const missing: string[] = [];

  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    if (isProduction) {
      throw new Error(message);
    } else {
      console.warn(`[env] Warning: ${message}`);
    }
  }

  // Warn about optional SMS vars
  const hasSomeTwilio = optionalVars.some((key) => process.env[key]);
  const hasAllTwilio = optionalVars.every((key) => process.env[key]);

  if (hasSomeTwilio && !hasAllTwilio) {
    const missingTwilio = optionalVars.filter((key) => !process.env[key]);
    console.warn(
      `[env] Twilio partially configured. Missing: ${missingTwilio.join(", ")}. SMS alerts will be disabled.`
    );
  }
}
