import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, siteObjects } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: siteId } = await params;
  const existing = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const features = Array.isArray(body?.features) ? body.features : [];

  await db.delete(siteObjects).where(eq(siteObjects.siteId, siteId));

  if (features.length > 0) {
    await db.insert(siteObjects).values(
      features.map((feature: any) => ({
        siteId,
        objectType: feature.objectType || "unclassified",
        geometry: feature.geometry,
        measurements: feature.measurements || {},
      }))
    );
  }

  return NextResponse.json({ ok: true, count: features.length });
}
