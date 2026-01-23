import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listJobs, getJobWithDetails } from "./actions";
import { db } from "@/lib/db";
import { estimates, estimateLineItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Get estimate total for a job
async function getEstimateTotal(estimateId: string | null) {
  if (!estimateId) return 0;

  const lineItems = await db
    .select()
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));

  return lineItems.reduce((sum, item) => sum + parseFloat(item.total || '0'), 0);
}

// Get estimate name
async function getEstimateName(estimateId: string | null) {
  if (!estimateId) return null;

  const [estimate] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .limit(1);

  return estimate?.title || null;
}

// Format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function JobsPage() {
  const session = await getSession();
  const jobs = session?.user?.id ? await listJobs(session.user.id) : [];

  // Get estimate totals for each job
  const jobsWithTotals = await Promise.all(
    jobs.map(async (job) => ({
      ...job,
      estimateTotal: await getEstimateTotal(job.estimateId),
      estimateName: await getEstimateName(job.estimateId),
    }))
  );

  const activeJobs = jobsWithTotals.filter(j => j.status === 'Active');
  const completedJobs = jobsWithTotals.filter(j => j.status === 'Completed');
  const totalValue = jobsWithTotals.reduce((sum, j) => sum + j.estimateTotal, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Jobs</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track budgets, costs, and real-time profitability from won bids.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View Bid Pipeline
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="app-shell-card p-5">
          <div className="text-sm text-slate-400">Total Jobs</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{jobs.length}</div>
        </div>
        <div className="app-shell-card p-5">
          <div className="text-sm text-slate-400">Active Jobs</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{activeJobs.length}</div>
        </div>
        <div className="app-shell-card p-5">
          <div className="text-sm text-slate-400">Completed</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{completedJobs.length}</div>
        </div>
        <div className="app-shell-card p-5">
          <div className="text-sm text-slate-400">Total Value</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No jobs yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            Jobs are automatically created when you mark a bid as &quot;Won&quot; in the pipeline.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Go to Bid Pipeline
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobsWithTotals.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="app-shell-card p-5 transition hover:border-blue-500/60 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-blue-400 transition">
                    {job.estimateName || `Job ${job.id.slice(0, 6)}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ID: {job.id.slice(0, 8)}...
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  job.status === 'Active'
                    ? 'bg-blue-500/20 text-blue-400'
                    : job.status === 'Completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {job.status}
                </span>
              </div>

              <div className="text-2xl font-bold text-slate-100 mb-2">
                {formatCurrency(job.estimateTotal)}
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>
                  {job.startDate ? `Started ${new Date(job.startDate).toLocaleDateString()}` : 'Not started'}
                </span>
                <span className="text-blue-400 group-hover:text-blue-300">
                  View Details &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
