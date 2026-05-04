"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

export default function AdminReportPage() {
  const [data, setData] = useState<{
    totalCommissionCents: number;
    totalSalesCents: number;
    orderCount: number;
    orders: { id: string; commissionCents: number; saleAmountCents: number; listing: { title: string } }[];
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/report");
      if (res.ok) setData(await res.json());
    })();
  }, []);

  if (!data) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commission report (last 30 days)</h1>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <dt className="text-zinc-500">Orders</dt>
          <dd className="text-xl font-semibold">{data.orderCount}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-zinc-500">Sales</dt>
          <dd className="text-xl font-semibold">{formatMoney(data.totalSalesCents)}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-zinc-500">Commission</dt>
          <dd className="text-xl font-semibold">{formatMoney(data.totalCommissionCents)}</dd>
        </div>
      </dl>
      <ul className="space-y-2 text-sm">
        {data.orders.map((o) => (
          <li key={o.id} className="flex justify-between rounded-lg border px-3 py-2">
            <span>{o.listing.title}</span>
            <span>
              {formatMoney(o.saleAmountCents)} · fee {formatMoney(o.commissionCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
