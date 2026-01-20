import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listJobs } from "./actions";

export default async function JobsPage() {
  const session = await getSession();
  const jobs = session?.user?.id ? await listJobs(session.user.id) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Jobs</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track budgets, costs, and real-time profitability.
        </p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">
          No jobs yet. Convert an estimate to start tracking costs.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="app-shell-card p-5 transition hover:border-amber-500/60"
            >
              <h3 className="text-lg font-semibold text-slate-100">Job {job.id.slice(0, 6)}</h3>
              <p className="mt-2 text-sm text-slate-400">Status: {job.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
