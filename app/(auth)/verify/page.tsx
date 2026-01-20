"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerifyState = "idle" | "loading" | "success" | "error";

export default function VerifyPage() {
  const [state, setState] = useState<VerifyState>("idle");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    const verify = async () => {
      setState("loading");
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      setState(response.ok ? "success" : "error");
    };

    void verify();
  }, [token]);

  return (
    <main className="w-full space-y-4 text-sm text-slate-300">
      <h1 className="text-3xl font-semibold text-slate-100">Verify your email</h1>
      {state === "loading" && <p>Verifying your account...</p>}
      {state === "success" && (
        <p>
          Your email is verified. You can now <Link className="text-amber-400" href="/login">sign in</Link>.
        </p>
      )}
      {state === "error" && <p>Verification link is invalid or expired.</p>}
    </main>
  );
}
