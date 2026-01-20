"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setLoading(false);
      const payload = await response.json().catch(() => null);
      setError(payload?.error || "Unable to register.");
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/dashboard";
  }

  return (
    <main className="w-full">
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-slate-400">
        Start estimating asphalt, sealcoating, and striping jobs in minutes.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        We will email a verification link before you can sign in.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-300">
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        Already have an account?{" "}
        <Link className="text-amber-400 hover:text-amber-300" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
