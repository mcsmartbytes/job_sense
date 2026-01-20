import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { createSite, listSites } from "./actions";

export default async function SitesPage() {
  const session = await getSession();
  const sites = session?.user?.id ? await listSites(session.user.id) : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Sites</h1>
          <p className="mt-2 text-sm text-slate-400">
            Measure once, reuse across asphalt, sealcoating, and striping.
          </p>
        </div>
      </header>

      <form action={createSite} className="app-shell-card p-6">
        <h2 className="text-lg font-semibold">Create a new site</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Site name
            <input
              name="name"
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="Plano Shopping Center"
              required
            />
          </label>
          <label className="text-sm text-slate-300">
            Address
            <input
              name="address"
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="123 Main St, Plano, TX"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Create site
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your sites</h2>
        {sites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">
            No sites yet. Create one to start mapping measurements.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sites.map((site) => (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="app-shell-card p-5 transition hover:border-amber-500/60"
              >
                <h3 className="text-lg font-semibold text-slate-100">{site.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{site.address || "No address"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
