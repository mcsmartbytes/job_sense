"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sites", label: "Sites" },
  { href: "/estimates", label: "Estimates" },
  { href: "/jobs", label: "Jobs" },
  { href: "/reports", label: "Reports" },
];

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <div className="px-6 py-6">
          <p className="text-lg font-semibold tracking-wide text-[color:var(--accent)]">
            Job Sense
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Estimate to profit clarity
          </p>
        </div>
        <nav className="px-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-[color:var(--glass-bg)] text-[color:var(--accent-2)]"
                        : "text-[color:var(--muted)] hover:bg-[color:var(--glass-bg)] hover:text-[color:var(--fg)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="app-shell-header px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[color:var(--muted)]">
                Asphalt • Sealcoating • Striping
              </p>
            </div>
            <div className="text-xs text-[color:var(--muted)]">Single-tenant demo</div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
