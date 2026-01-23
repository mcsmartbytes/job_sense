"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { costCodes, jobCosts, jobs, estimates, estimateLineItems } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

// Type for bid data from the dashboard
export interface BidToJobData {
  name: string;
  customerName?: string;
  siteAddress?: string;
  estimatedValue?: number;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

export async function listJobs(userId: string) {
  return db.select().from(jobs).where(eq(jobs.userId, userId));
}

export async function listCostCodes() {
  return db.select().from(costCodes);
}

export async function listJobCosts(jobId: string) {
  return db.select().from(jobCosts).where(eq(jobCosts.jobId, jobId));
}

export async function addJobCost(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const jobId = formData.get("jobId")?.toString();
  const costCodeId = formData.get("costCodeId")?.toString();
  const description = formData.get("description")?.toString().trim();
  const amountRaw = formData.get("amount")?.toString();

  if (!jobId || !amountRaw) {
    throw new Error("Missing job cost data");
  }

  const jobResult = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)))
    .limit(1);

  if (!jobResult[0]) {
    throw new Error("Invalid job");
  }

  const amount = Number(amountRaw);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  await db.insert(jobCosts).values({
    jobId,
    costCodeId: costCodeId || undefined,
    description: description || null,
    amount: amount.toString(),
  });
}

// Create a job from a won bid (with estimate data)
export async function createJobFromWonBid(bidData: BidToJobData) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // First, create an estimate record for this bid
  const [estimate] = await db
    .insert(estimates)
    .values({
      userId: session.user.id,
      title: bidData.name,
      status: "Approved",
    })
    .returning();

  // Create estimate line items from bid line items
  if (bidData.lineItems && bidData.lineItems.length > 0) {
    await db.insert(estimateLineItems).values(
      bidData.lineItems.map((item) => ({
        estimateId: estimate.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        total: item.total.toString(),
      }))
    );
  }

  // Create the job linked to the estimate
  const [job] = await db
    .insert(jobs)
    .values({
      estimateId: estimate.id,
      userId: session.user.id,
      status: "Active",
    })
    .returning();

  return {
    jobId: job.id,
    estimateId: estimate.id,
  };
}

// Get job with full details
export async function getJobWithDetails(jobId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)))
    .limit(1);

  if (!job) {
    return null;
  }

  // Get associated estimate
  let estimate = null;
  let lineItems: any[] = [];

  if (job.estimateId) {
    const [est] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, job.estimateId))
      .limit(1);

    estimate = est;

    if (estimate) {
      lineItems = await db
        .select()
        .from(estimateLineItems)
        .where(eq(estimateLineItems.estimateId, estimate.id));
    }
  }

  // Get job costs
  const costs = await db
    .select()
    .from(jobCosts)
    .where(eq(jobCosts.jobId, jobId));

  return {
    ...job,
    estimate,
    lineItems,
    costs,
  };
}
