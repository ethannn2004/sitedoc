import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTestAlert } from "@/lib/alerts";
import { isRateLimited } from "@/lib/rate-limit";
import { isTwilioConfigured } from "@/lib/alerts/channels/sms";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict rate limit: 3 test SMS per minute
  if (isRateLimited(`test-sms:${session.user.id}`, { windowMs: 60_000, maxRequests: 3 })) {
    return NextResponse.json({ error: "Too many test requests. Try again in a minute." }, { status: 429 });
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: "Twilio is not configured. SMS alerts will be logged to the server console in development." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.phone) {
    return NextResponse.json(
      { error: "Please save a phone number first." },
      { status: 400 }
    );
  }

  const result = await sendTestAlert(user.phone);

  if (result.success) {
    return NextResponse.json({ message: "Test SMS sent successfully." });
  } else {
    return NextResponse.json(
      { error: result.error || "Failed to send test SMS." },
      { status: 500 }
    );
  }
}
