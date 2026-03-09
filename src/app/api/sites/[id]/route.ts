import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

async function getSiteForUser(id: string, userId: string) {
  return prisma.monitoredSite.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await getSiteForUser(id, session.user.id);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  return NextResponse.json(site);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await getSiteForUser(id, session.user.id);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const { url: rawUrl, label } = await request.json();

  const updateData: Record<string, string> = {};

  if (label) updateData.label = label.trim();

  if (rawUrl) {
    const url = normalizeUrl(rawUrl);
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    // Check duplicate if URL changed
    if (url !== site.url) {
      const dup = await prisma.monitoredSite.findUnique({
        where: { userId_url: { userId: session.user.id, url } },
      });
      if (dup) {
        return NextResponse.json(
          { error: "You're already monitoring this URL." },
          { status: 409 }
        );
      }
    }

    updateData.url = url;
  }

  const updated = await prisma.monitoredSite.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await getSiteForUser(id, session.user.id);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  await prisma.monitoredSite.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
