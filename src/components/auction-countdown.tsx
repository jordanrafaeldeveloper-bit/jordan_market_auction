"use client";

import { useEffect, useState } from "react";

type Props = { endsAt: string | null };

export function AuctionCountdown({ endsAt }: Props) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(null);
      return;
    }
    const end = new Date(endsAt).getTime();
    const tick = () => {
      const ms = end - Date.now();
      setLeft(ms > 0 ? ms : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return <span className="text-zinc-500">No auction timer</span>;
  if (left == null) return <span className="animate-pulse text-zinc-400">…</span>;
  if (left <= 0) return <span className="font-medium text-red-600">Ended</span>;

  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <span className="font-mono text-lg tabular-nums text-zinc-900 dark:text-zinc-100">
      {h > 0 ? `${h}h ` : ""}
      {m}m {sec.toString().padStart(2, "0")}s
    </span>
  );
}
