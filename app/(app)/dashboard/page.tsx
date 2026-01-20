export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track active estimates, live jobs, and margin performance.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active Estimates", value: "0" },
          { label: "Jobs in Progress", value: "0" },
          { label: "Avg. Margin", value: "--" },
        ].map((card) => (
          <div key={card.label} className="app-shell-card p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-100">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="app-shell-card p-6">
        <h2 className="text-lg font-semibold">What to do next</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>1. Create your first site measurement.</li>
          <li>2. Build an estimate from the trade templates.</li>
          <li>3. Convert the estimate into a live job.</li>
        </ul>
      </section>
    </div>
  );
}
