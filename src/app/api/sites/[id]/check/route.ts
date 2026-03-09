import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkSite } from "@/lib/monitor";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await prisma.monitoredSite.findFirst({
    where: { id, userId: session.user.id },
    include: { user: true },
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const result = await checkSite(site);

  return NextResponse.json({
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    lastCheckedAt: result.checkedAt,
    lastDiagnosis: result.diagnosis,
    lastSuggestion: result.suggestedFix,
  });
}
