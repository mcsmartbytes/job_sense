"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function createSite(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name")?.toString().trim();
  const address = formData.get("address")?.toString().trim();

  if (!name) {
    throw new Error("Site name is required");
  }

  await db.insert(sites).values({
    userId: session.user.id,
    name,
    address: address || null,
  });
}

export async function listSites(userId: string) {
  return db.select().from(sites).where(eq(sites.userId, userId));
}
