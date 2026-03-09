import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const site = await prisma.monitoredSite.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const results = await prisma.checkResult.findMany({
    where: { siteId: id },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(results);
}
