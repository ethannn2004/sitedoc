import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const incidents = await prisma.incident.findMany({
    where: { site: { userId: session.user.id } },
    include: { site: { select: { label: true, url: true } } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(incidents);
}
