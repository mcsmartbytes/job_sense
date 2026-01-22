import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  costCodes,
  estimateLineItems,
  estimates,
  sites,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { addLineItem, convertEstimateToJob, deleteLineItem, listCostCodes } from "../actions";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    notFound();
  }

  const estimateResult = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.userId, session.user.id)))
    .limit(1);

  const estimate = estimateResult[0];
  if (!estimate) {
    notFound();
  }

  const siteResult = await db.select().from(sites).where(eq(sites.id, estimate.siteId!)).limit(1);
  const site = siteResult[0];

  const lineItems = await db
    .select({
      id: estimateLineItems.id,
      description: estimateLineItems.description,
      quantity: estimateLineItems.quantity,
      unit: estimateLineItems.unit,
      unitPrice: estimateLineItems.unitPrice,
      total: estimateLineItems.total,
      costCodeId: estimateLineItems.costCodeId,
      costCodeLabel: costCodes.label,
    })
    .from(estimateLineItems)
    .leftJoin(costCodes, eq(estimateLineItems.costCodeId, costCodes.id))
    .where(eq(estimateLineItems.estimateId, estimate.id));

  const codes = await listCostCodes();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{estimate.title}</h1>
        <p className="text-sm text-slate-400">
          {site?.name || "Unknown site"} • Total: ${estimate.total}
        </p>
      </header>

      <form action={addLineItem} className="app-shell-card p-6">
        <h2 className="text-lg font-semibold">Add line item</h2>
        <input type="hidden" name="estimateId" value={estimate.id} />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <input
            name="description"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="Sealcoat - 2 coats"
            required
          />
          <input
            name="quantity"
            type="number"
            step="0.01"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="12000"
            required
          />
          <input
            name="unit"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="sq ft"
            required
          />
          <input
            name="unitPrice"
            type="number"
            step="0.01"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="0.18"
            required
          />
          <select
            name="costCodeId"
            className="md:col-span-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Select cost code</option>
            {codes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.code} - {code.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Add line item
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Line items</h2>
        {lineItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">
            No line items yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[color:var(--glass-border)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Cost Code</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-900 text-slate-200">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3">${item.unitPrice}</td>
                    <td className="px-4 py-3">${item.total}</td>
                    <td className="px-4 py-3">{item.costCodeLabel || "--"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteLineItem}>
                        <input type="hidden" name="estimateId" value={estimate.id} />
                        <input type="hidden" name="lineItemId" value={item.id} />
                        <button className="text-xs text-slate-400 hover:text-red-300">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form action={convertEstimateToJob} className="app-shell-card p-6">
        <input type="hidden" name="estimateId" value={estimate.id} />
        <h2 className="text-lg font-semibold">Convert to job</h2>
        <p className="mt-2 text-sm text-slate-300">
          Lock this estimate and start tracking job costs.
        </p>
        <button
          type="submit"
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Create job
        </button>
      </form>
    </div>
  );
}
