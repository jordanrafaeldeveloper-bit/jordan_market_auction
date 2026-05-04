"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        name: fd.get("name"),
        phone: fd.get("phone") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "Registration failed");
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold">Create account</h1>
      <div>
        <label className="text-sm font-medium">Name</label>
        <input name="name" required className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      <div>
        <label className="text-sm font-medium">Phone (optional)</label>
        <input name="phone" className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      <div>
        <label className="text-sm font-medium">Password (min 8)</label>
        <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-zinc-900 py-2.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
        Register
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account? <Link href="/login" className="text-violet-700 underline">Log in</Link>
      </p>
    </form>
  );
}
