"use client";

import { useState } from "react";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    await fetch("/api/auth/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setStatus("sent");
  }

  return (
    <main className="w-full space-y-4">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="text-sm text-slate-400">We will email a reset link.</p>
      <form onSubmit={onSubmit} className="space-y-4">
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
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Sending..." : "Send reset link"}
        </button>
        {status === "sent" && (
          <p className="text-sm text-slate-400">If an account exists, the reset email is on its way.</p>
        )}
      </form>
    </main>
  );
}
