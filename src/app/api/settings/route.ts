import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { sites: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    smsAlertsEnabled: user.smsAlertsEnabled,
    onboardingCompleted: user.onboardingCompleted,
    plan: user.plan,
    siteCount: user._count.sites,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id, { windowMs: 60_000, maxRequests: 30 })) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  if ("phone" in body) {
    updateData.phone = body.phone?.trim() || null;
  }

  if ("smsAlertsEnabled" in body) {
    updateData.smsAlertsEnabled = body.smsAlertsEnabled === true;
  }

  if ("plan" in body) {
    if (!PLANS[body.plan as PlanId]) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const siteCount = await prisma.monitoredSite.count({
      where: { userId: session.user.id },
    });
    const newPlan = PLANS[body.plan as PlanId];
    if (siteCount > newPlan.maxSites) {
      return NextResponse.json(
        {
          error: `Cannot switch to ${newPlan.name}: you have ${siteCount} sites but the plan allows ${newPlan.maxSites}. Remove some sites first.`,
        },
        { status: 400 }
      );
    }

    updateData.plan = body.plan;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    include: { _count: { select: { sites: true } } },
  });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    smsAlertsEnabled: user.smsAlertsEnabled,
    plan: user.plan,
    siteCount: user._count.sites,
  });
}
