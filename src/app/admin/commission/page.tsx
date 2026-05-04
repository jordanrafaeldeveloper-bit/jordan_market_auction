"use client";

import { useEffect, useState } from "react";

export default function AdminCommissionPage() {
  const [mode, setMode] = useState("PERCENTAGE");
  const [percentage, setPercentage] = useState("5");
  const [fixedCents, setFixedCents] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/commission");
      if (!res.ok) return;
      const d = await res.json();
      setMode(d.mode);
      setPercentage(String(d.percentage));
      setFixedCents(String(d.fixedCents));
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        percentage: parseFloat(percentage),
        fixedCents: parseInt(fixedCents, 10),
      }),
    });
    if (!res.ok) setMsg("Save failed");
    else setMsg("Saved");
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Commission</h1>
      <div>
        <label className="text-sm font-medium">Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900">
          <option value="PERCENTAGE">Percentage only</option>
          <option value="FIXED">Fixed amount only (cents)</option>
          <option value="BOTH">Percentage + fixed</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Percentage (%)</label>
        <input value={percentage} onChange={(e) => setPercentage(e.target.value)} type="number" step="0.1" className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
      </div>
      <div>
        <label className="text-sm font-medium">Fixed (cents)</label>
        <input value={fixedCents} onChange={(e) => setFixedCents(e.target.value)} type="number" className="mt-1 w-full rounded-xl border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
        Save
      </button>
    </form>
  );
}
