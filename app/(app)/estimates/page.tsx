import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { createEstimate, listEstimatesForUser, listSitesForUser, seedCostCodes } from "./actions";

export default async function EstimatesPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const sites = userId ? await listSitesForUser(userId) : [];
  const estimates = userId ? await listEstimatesForUser(userId) : [];
  const siteMap = new Map(sites.map((site) => [site.id, site]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Estimates</h1>
          <p className="mt-2 text-sm text-slate-400">
            Turn measurements into trade-ready pricing in minutes.
          </p>
        </div>
        <form action={seedCostCodes}>
          <button className="rounded-md border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-amber-500/60">
            Seed cost codes
          </button>
        </form>
      </header>

      <form action={createEstimate} className="app-shell-card p-6">
        <h2 className="text-lg font-semibold">Create a new estimate</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Estimate title
            <input
              name="title"
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="Plano Shopping Center - Phase 1"
            />
          </label>
          <label className="text-sm text-slate-300">
            Site
            <select
              name="siteId"
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
              required
            >
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Create estimate
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your estimates</h2>
        {estimates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">
            No estimates yet. Create one from your mapped site data.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {estimates.map((estimate) => {
              const site = estimate.siteId ? siteMap.get(estimate.siteId) : null;
              return (
              <Link
                key={estimate.id}
                href={`/estimates/${estimate.id}`}
                className="app-shell-card p-5 transition hover:border-amber-500/60"
              >
                  <h3 className="text-lg font-semibold text-slate-100">{estimate.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {site?.name || "Unknown site"}
                  </p>
                  <p className="mt-3 text-sm text-amber-300">Total: ${estimate.total}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
