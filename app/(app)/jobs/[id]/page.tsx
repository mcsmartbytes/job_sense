import { and, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { costCodes, estimateLineItems, jobBudgets, jobCosts, jobs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { addJobCost, listCostCodes, listJobCosts } from "../actions";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    notFound();
  }

  const jobResult = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, params.id), eq(jobs.userId, session.user.id)))
    .limit(1);

  const job = jobResult[0];
  if (!job) {
    notFound();
  }

  const budgets = await db
    .select({
      id: jobBudgets.id,
      budgetTotal: jobBudgets.budgetTotal,
      description: estimateLineItems.description,
      unit: estimateLineItems.unit,
      quantity: estimateLineItems.quantity,
    })
    .from(jobBudgets)
    .leftJoin(estimateLineItems, eq(jobBudgets.estimateLineItemId, estimateLineItems.id))
    .where(eq(jobBudgets.jobId, job.id));

  const totals = await db
    .select({
      budgetTotal: sql<string>`coalesce(sum(${jobBudgets.budgetTotal}), 0)`,
      actualTotal: sql<string>`coalesce(sum(${jobCosts.amount}), 0)`,
    })
    .from(jobBudgets)
    .leftJoin(jobCosts, eq(jobCosts.jobId, job.id))
    .where(eq(jobBudgets.jobId, job.id));

  const budgetTotal = Number(totals[0]?.budgetTotal || 0);
  const actualTotal = Number(totals[0]?.actualTotal || 0);
  const variance = actualTotal - budgetTotal;
  const variancePct = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

  const codes = await listCostCodes();
  const costs = await listJobCosts(job.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Job {job.id.slice(0, 6)}</h1>
        <p className="mt-2 text-sm text-slate-400">Status: {job.status}</p>
      </header>

      <section className="app-shell-card p-6">
        <h2 className="text-lg font-semibold">Budget snapshot</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="app-shell-card p-4">
            <p className="text-xs uppercase text-slate-500">Budget</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">${budgetTotal.toFixed(2)}</p>
          </div>
          <div className="app-shell-card p-4">
            <p className="text-xs uppercase text-slate-500">Actual</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">${actualTotal.toFixed(2)}</p>
          </div>
          <div className="app-shell-card p-4">
            <p className="text-xs uppercase text-slate-500">Variance</p>
            <p className={`mt-2 text-2xl font-semibold ${variance > 0 ? "text-red-300" : "text-emerald-300"}`}>
              {variance >= 0 ? "+" : ""}${variance.toFixed(2)} ({variancePct.toFixed(1)}%)
            </p>
          </div>
        </div>
        {budgets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No budgets created yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {budgets.map((budget) => (
              <li key={budget.id}>
                {budget.description} ({budget.quantity} {budget.unit}) — ${budget.budgetTotal}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Log actual costs</h2>
        <form action={addJobCost} className="app-shell-card p-6">
          <input type="hidden" name="jobId" value={job.id} />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="description"
              className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="Sealer material purchase"
            />
            <select
              name="costCodeId"
              className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Select cost code</option>
              {codes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.code} - {code.label}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              placeholder="250.00"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Add cost
          </button>
        </form>

        <div className="app-shell-card p-6">
          <h3 className="text-sm font-semibold text-slate-200">Actual cost entries</h3>
          {costs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No costs logged yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {costs.map((cost) => (
                <li key={cost.id} className="flex items-center justify-between">
                  <span>{cost.description || "Cost entry"}</span>
                  <span>${Number(cost.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
