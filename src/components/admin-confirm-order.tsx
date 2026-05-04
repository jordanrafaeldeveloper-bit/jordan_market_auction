"use client";

import { useState } from "react";

export function AdminConfirmOrder({ orderId }: { orderId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/confirm`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg(data.error ?? "Failed");
    else window.location.reload();
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Admin: confirm bank payment</p>
      <button
        type="button"
        disabled={busy}
        onClick={confirm}
        className="mt-2 rounded-lg bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-800"
      >
        Mark paid
      </button>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
    </div>
  );
}
