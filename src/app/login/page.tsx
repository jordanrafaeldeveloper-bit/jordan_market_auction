"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function LoginForm() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/";
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
      callbackUrl,
    });
    setBusy(false);
    if (res?.error) {
      setErr("Invalid email or password");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold">Log in</h1>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      <div>
        <label className="text-sm font-medium">Password</label>
        <input name="password" type="password" required className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-zinc-900 py-2.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
        {busy ? "…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        No account? <Link href="/register" className="text-violet-700 underline">Register</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
