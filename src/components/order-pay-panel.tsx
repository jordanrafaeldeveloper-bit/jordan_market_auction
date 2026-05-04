"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";

type Props = {
  orderId: string;
  isBuyer: boolean;
  status: string;
  saleAmountCents: number;
  allowSimulate: boolean;
};

export function OrderPayPanel({ orderId, isBuyer, status, saleAmountCents, allowSimulate }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isBuyer || status !== "PENDING_PAYMENT") return null;

  async function paypal() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/checkout/paypal`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "PayPal unavailable");
      return;
    }
    if (data.approveUrl) window.location.href = data.approveUrl;
    else setMsg("No approval URL returned");
  }

  async function mercado() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/checkout/mercadopago`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Mercado Pago unavailable");
      return;
    }
    if (data.initPoint) window.location.href = data.initPoint;
    else setMsg("No checkout URL returned");
  }

  async function bank() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/checkout/bank`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg(`Bank deposit: ${data.instructions} (reference: ${data.reference}) Amount: ${formatMoney(data.amountCents)}`);
  }

  async function simulate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/simulate-pay`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Simulate disabled");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium">Pay {formatMoney(saleAmountCents)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={paypal}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          PayPal
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={mercado}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
        >
          Mercado Pago
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={bank}
          className="rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Bank instructions
        </button>
        {allowSimulate && (
          <button
            type="button"
            disabled={busy}
            onClick={simulate}
            className="rounded-lg border border-dashed border-amber-500 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
          >
            Simulate pay (dev)
          </button>
        )}
      </div>
      {msg && <p className="text-sm text-zinc-600 dark:text-zinc-400">{msg}</p>}
    </div>
  );
}
