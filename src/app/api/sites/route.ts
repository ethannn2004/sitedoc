import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import { getPlanLimits } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const sites = await prisma.monitoredSite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sites);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { url: rawUrl, label } = await request.json();

  if (!rawUrl || !label) {
    return NextResponse.json(
      { error: "URL and label are required." },
      { status: 400 }
    );
  }

  const url = normalizeUrl(rawUrl);

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "Invalid URL. Please include https://." },
      { status: 400 }
    );
  }

  // Check plan limits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { sites: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const planLimits = getPlanLimits(user.plan);
  if (user._count.sites >= planLimits.maxSites) {
    return NextResponse.json(
      {
        error: `You've reached the limit of ${planLimits.maxSites} site(s) on the ${planLimits.name} plan. Upgrade to add more.`,
      },
      { status: 403 }
    );
  }

  // Check for duplicates
  const existing = await prisma.monitoredSite.findUnique({
    where: { userId_url: { userId: session.user.id, url } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You're already monitoring this URL." },
      { status: 409 }
    );
  }

  const site = await prisma.monitoredSite.create({
    data: {
      userId: session.user.id,
      url,
      label: label.trim(),
    },
  });

  return NextResponse.json(site, { status: 201 });
}
