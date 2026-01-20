"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="w-full">
      <h1 className="text-3xl font-semibold">Job Sense</h1>
      <p className="mt-2 text-sm text-slate-400">
        Sign in to manage estimates and job costs.
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
            autoComplete="current-password"
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        New here?{" "}
        <Link className="text-amber-400 hover:text-amber-300" href="/register">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Forgot password?{" "}
        <Link className="text-amber-400 hover:text-amber-300" href="/reset-request">
          Reset it
        </Link>
      </p>
    </main>
  );
}
