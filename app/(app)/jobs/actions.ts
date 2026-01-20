"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { costCodes, jobCosts, jobs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

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
