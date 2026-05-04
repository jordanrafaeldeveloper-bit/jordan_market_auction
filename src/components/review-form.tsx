"use client";

import { useState } from "react";

export function ReviewForm({ orderId, existingRating }: { orderId: string; existingRating?: number }) {
  const [rating, setRating] = useState(existingRating ?? 5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<string | null>(
    existingRating != null ? "You already submitted a review." : null,
  );
  const [busy, setBusy] = useState(false);

  if (existingRating != null) {
    return <p className="text-sm text-zinc-500">Your review: {existingRating}/5</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg("Thanks for your review.");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="font-medium">Leave a review</h3>
      <label className="block text-sm">
        Rating
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment (optional)"
        rows={3}
        className="w-full rounded-lg border px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
      />
      {msg && <p className="text-sm text-zinc-600">{msg}</p>}
      <button type="submit" disabled={busy} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
        Submit review
      </button>
    </form>
  );
}
