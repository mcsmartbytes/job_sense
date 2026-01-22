import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites, siteObjects } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import SiteDetailClient from "./SiteDetailClient";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    notFound();
  }

  const result = await db
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .limit(1);

  const site = result[0];
  if (!site || site.userId !== session.user.id) {
    notFound();
  }

  const objects = await db
    .select()
    .from(siteObjects)
    .where(eq(siteObjects.siteId, site.id));

  const initialObjects = objects.map((obj) => ({
    id: obj.id,
    site_id: site.id,
    object_type: obj.objectType as any,
    sub_type: null,
    tags: [],
    geometry: obj.geometry as GeoJSON.Geometry,
    measurements: obj.measurements as any,
    properties: {},
    source: "manual" as const,
    confidence: null,
    label: null,
    color: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return (
    <SiteDetailClient
      siteId={site.id}
      siteName={site.name}
      initialObjects={initialObjects}
    />
  );
}
