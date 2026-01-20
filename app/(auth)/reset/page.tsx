"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ResetState = "idle" | "loading" | "success" | "error";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<ResetState>("idle");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setState("error");
      return;
    }

    setState("loading");
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setState(response.ok ? "success" : "error");
  }

  return (
    <main className="w-full space-y-4">
      <h1 className="text-3xl font-semibold">Set a new password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
            required
          />
        </label>
        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "loading" ? "Updating..." : "Update password"}
        </button>
      </form>
      {state === "success" && (
        <p className="text-sm text-slate-400">
          Password updated. <Link className="text-amber-400" href="/login">Sign in</Link>.
        </p>
      )}
      {state === "error" && <p className="text-sm text-red-400">Unable to reset password.</p>}
    </main>
  );
}
