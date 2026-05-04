"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SellForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const imageUrls = String(fd.get("imageUrls") || "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const min = parseFloat(String(fd.get("minUsd")));
    const buy = fd.get("buyUsd")?.toString().trim();
    const body = {
      title: fd.get("title"),
      description: fd.get("description"),
      imageUrls,
      minPriceCents: Math.round(min * 100),
      buyNowPriceCents: buy ? Math.round(parseFloat(buy) * 100) : null,
      bidIncrementCents: Math.round(parseFloat(String(fd.get("incrementUsd") || "1")) * 100),
      salesMethod: fd.get("salesMethod"),
      auctionDurationHours: parseInt(String(fd.get("hours") || "72"), 10),
      autoRelist: fd.get("autoRelist") === "on",
      publish: fd.get("publish") === "on",
    };
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Could not save listing");
      return;
    }
    router.push(`/listings/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input name="title" required className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea name="description" required rows={5} className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
      </div>
      <div>
        <label className="text-sm font-medium">Image URLs (comma or newline)</label>
        <textarea name="imageUrls" rows={2} placeholder="https://..." className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Minimum / reserve (USD)</label>
          <input name="minUsd" type="number" step="0.01" min="0.01" required className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
        </div>
        <div>
          <label className="text-sm font-medium">Buy now price (USD, optional)</label>
          <input name="buyUsd" type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Bid increment (USD)</label>
          <input name="incrementUsd" type="number" step="0.01" defaultValue="1" className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
        </div>
        <div>
          <label className="text-sm font-medium">Auction length (hours)</label>
          <input name="hours" type="number" min="1" defaultValue="72" className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Sales method</label>
        <select name="salesMethod" className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900">
          <option value="BOTH">Auction + buy now</option>
          <option value="AUCTION_ONLY">Auction only</option>
          <option value="BUY_NOW_ONLY">Buy now only</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="autoRelist" defaultChecked />
        Auto-relist if reserve not met
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" defaultChecked />
        Publish immediately
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-zinc-900 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {busy ? "Saving…" : "Create listing"}
      </button>
    </form>
  );
}
