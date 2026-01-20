"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  costCodes,
  estimateLineItems,
  estimates,
  jobs,
  jobBudgets,
  sites,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

const defaultCostCodes = [
  { code: "ASPH-PAVE", label: "Asphalt paving", trade: "asphalt" },
  { code: "ASPH-PATCH", label: "Asphalt patch", trade: "asphalt" },
  { code: "ASPH-CRACK", label: "Crack sealing", trade: "asphalt" },
  { code: "SEAL-1", label: "Sealcoat 1 coat", trade: "sealcoating" },
  { code: "SEAL-2", label: "Sealcoat 2 coats", trade: "sealcoating" },
  { code: "STRP-STALL", label: "Standard stall", trade: "striping" },
  { code: "STRP-ADA", label: "ADA stall", trade: "striping" },
  { code: "STRP-FIRE", label: "Fire lane curb", trade: "striping" },
  { code: "STRP-ARROW", label: "Directional arrow", trade: "striping" },
];

export async function seedCostCodes() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existing = await db.select().from(costCodes).limit(1);
  if (existing.length > 0) {
    return { ok: true };
  }

  await db.insert(costCodes).values(defaultCostCodes);
  return { ok: true };
}

export async function listSitesForUser(userId: string) {
  return db.select().from(sites).where(eq(sites.userId, userId));
}

export async function listEstimatesForUser(userId: string) {
  return db.select().from(estimates).where(eq(estimates.userId, userId));
}

export async function listCostCodes() {
  return db.select().from(costCodes);
}

export async function createEstimate(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const siteId = formData.get("siteId")?.toString();
  const titleInput = formData.get("title")?.toString().trim();

  if (!siteId) {
    throw new Error("Site is required");
  }

  const siteResult = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  const site = siteResult[0];
  if (!site || site.userId !== session.user.id) {
    throw new Error("Invalid site");
  }

  const title = titleInput || `${site.name} Estimate`;

  const inserted = await db
    .insert(estimates)
    .values({
      siteId,
      userId: session.user.id,
      title,
    })
    .returning({ id: estimates.id });

  const estimate = inserted[0];
  if (estimate) {
    redirect(`/estimates/${estimate.id}`);
  }
}

export async function addLineItem(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const estimateId = formData.get("estimateId")?.toString();
  const description = formData.get("description")?.toString().trim();
  const unit = formData.get("unit")?.toString().trim();
  const quantityRaw = formData.get("quantity")?.toString();
  const unitPriceRaw = formData.get("unitPrice")?.toString();
  const costCodeId = formData.get("costCodeId")?.toString() || null;

  if (!estimateId || !description || !unit || !quantityRaw || !unitPriceRaw) {
    throw new Error("Missing line item data");
  }

  const estimateResult = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .limit(1);

  const estimate = estimateResult[0];
  if (!estimate || estimate.userId !== session.user.id) {
    throw new Error("Invalid estimate");
  }

  const quantity = Number(quantityRaw);
  const unitPrice = Number(unitPriceRaw);
  const total = quantity * unitPrice;

  await db.insert(estimateLineItems).values({
    estimateId,
    description,
    quantity: quantity.toString(),
    unit,
    unitPrice: unitPrice.toString(),
    total: total.toString(),
    costCodeId: costCodeId || undefined,
  });

  const totals = await db
    .select({
      total: sql<string>`coalesce(sum(${estimateLineItems.total}), 0)`,
    })
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));

  await db
    .update(estimates)
    .set({ total: totals[0]?.total || "0" })
    .where(eq(estimates.id, estimateId));
}

export async function deleteLineItem(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const estimateId = formData.get("estimateId")?.toString();
  const lineItemId = formData.get("lineItemId")?.toString();

  if (!estimateId || !lineItemId) {
    throw new Error("Missing line item");
  }

  const estimateResult = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .limit(1);

  const estimate = estimateResult[0];
  if (!estimate || estimate.userId !== session.user.id) {
    throw new Error("Invalid estimate");
  }

  await db.delete(estimateLineItems).where(eq(estimateLineItems.id, lineItemId));

  const totals = await db
    .select({
      total: sql<string>`coalesce(sum(${estimateLineItems.total}), 0)`,
    })
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));

  await db
    .update(estimates)
    .set({ total: totals[0]?.total || "0" })
    .where(eq(estimates.id, estimateId));
}

export async function convertEstimateToJob(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const estimateId = formData.get("estimateId")?.toString();
  if (!estimateId) {
    throw new Error("Missing estimate");
  }

  const estimateResult = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .limit(1);

  const estimate = estimateResult[0];
  if (!estimate || estimate.userId !== session.user.id) {
    throw new Error("Invalid estimate");
  }

  const insertedJob = await db
    .insert(jobs)
    .values({ estimateId, userId: session.user.id })
    .returning({ id: jobs.id });

  const job = insertedJob[0];
  if (!job) {
    throw new Error("Unable to create job");
  }

  const items = await db
    .select()
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));

  if (items.length > 0) {
    await db.insert(jobBudgets).values(
      items.map((item) => ({
        jobId: job.id,
        estimateLineItemId: item.id,
        budgetTotal: item.total,
      }))
    );
  }

  redirect(`/jobs/${job.id}`);
}
