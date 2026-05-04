"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AuctionCountdown } from "@/components/auction-countdown";
import { formatMoney } from "@/lib/money";

type BidRow = {
  id: string;
  amountCents: number;
  createdAt: string;
  bidder: { id: string; name: string };
};

type Listing = {
  id: string;
  title: string;
  description: string;
  images: unknown;
  minPriceCents: number;
  buyNowPriceCents: number | null;
  bidIncrementCents: number;
  salesMethod: string;
  status: string;
  auctionEndsAt: string | null;
  currentBidCents: number | null;
  leaderUserId: string | null;
  seller: { id: string; name: string; sellerRatingAvg: number };
  bids: BidRow[];
};

export function ListingDetailClient({ initial }: { initial: Listing }) {
  const { data: session, status } = useSession();
  const [listing, setListing] = useState(initial);
  const [amount, setAmount] = useState("");
  const [maxAuto, setMaxAuto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/listings/${listing.id}`);
    if (res.ok) setListing(await res.json());
  }, [listing.id]);

  useEffect(() => {
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const amountCents = Math.round(parseFloat(amount) * 100);
    const maxAutoCents = Math.round(parseFloat(maxAuto || amount) * 100);
    const res = await fetch(`/api/listings/${listing.id}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents, maxAutoCents }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Bid failed");
      return;
    }
    setListing(data);
    setAmount("");
    setMaxAuto("");
    setMsg("Bid placed");
  }

  async function buyNow() {
    setMsg(null);
    setBusy(true);
    const res = await fetch(`/api/listings/${listing.id}/buy`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Could not complete purchase");
      return;
    }
    window.location.href = `/orders/${data.id}`;
  }

  const canBid =
    listing.status === "ACTIVE" &&
    (listing.salesMethod === "AUCTION_ONLY" || listing.salesMethod === "BOTH") &&
    listing.auctionEndsAt;

  const canBuy =
    listing.status === "ACTIVE" &&
    (listing.salesMethod === "BUY_NOW_ONLY" || listing.salesMethod === "BOTH") &&
    listing.buyNowPriceCents != null;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">No image</div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Seller {listing.seller.name} · ★ {listing.seller.sellerRatingAvg.toFixed(1)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{listing.description}</p>

        {canBid && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 dark:border-violet-900 dark:bg-violet-950/40">
            <h2 className="font-semibold text-violet-900 dark:text-violet-100">Auction</h2>
            <p className="mt-1 text-sm text-violet-800/90 dark:text-violet-200/90">
              Reserve {formatMoney(listing.minPriceCents)} · Increment {formatMoney(listing.bidIncrementCents)} · Last 5
              minutes extend by 5 minutes when bids arrive.
            </p>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Time left: <AuctionCountdown endsAt={listing.auctionEndsAt} />
            </p>
            <p className="mt-2 text-lg font-medium">
              Current bid: {formatMoney(listing.currentBidCents ?? listing.minPriceCents)}
            </p>
            {status === "authenticated" && session?.user?.id !== listing.seller.id ? (
              <form onSubmit={placeBid} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Your bid (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={((listing.currentBidCents ?? listing.minPriceCents) + listing.bidIncrementCents) / 100}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Auto-bid max (USD, optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxAuto}
                    onChange={(e) => setMaxAuto(e.target.value)}
                    placeholder="Same as bid if empty"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-violet-700 py-2.5 font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  Place bid
                </button>
              </form>
            ) : status === "authenticated" ? (
              <p className="mt-3 text-sm text-zinc-500">You cannot bid on your own listing.</p>
            ) : (
              <p className="mt-3 text-sm">
                <a href="/login" className="font-medium text-violet-700 underline">
                  Log in
                </a>{" "}
                to bid.
              </p>
            )}
          </div>
        )}

        {canBuy && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
            <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">Buy now</h2>
            <p className="mt-2 text-2xl font-bold">{formatMoney(listing.buyNowPriceCents!)}</p>
            {status === "authenticated" && session?.user?.id !== listing.seller.id ? (
              <button
                type="button"
                disabled={busy}
                onClick={buyNow}
                className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Buy now
              </button>
            ) : status === "authenticated" ? (
              <p className="mt-3 text-sm text-zinc-500">You cannot buy your own listing.</p>
            ) : (
              <p className="mt-3 text-sm">
                <a href="/login" className="font-medium text-emerald-800 underline dark:text-emerald-300">
                  Log in
                </a>{" "}
                to purchase.
              </p>
            )}
          </div>
        )}

        {msg && <p className="text-sm text-zinc-600 dark:text-zinc-400">{msg}</p>}

        <div>
          <h3 className="font-medium">Recent bids</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {listing.bids.map((b) => (
              <li key={b.id}>
                {b.bidder.name} · {formatMoney(b.amountCents)} · {new Date(b.createdAt).toLocaleString()}
              </li>
            ))}
            {listing.bids.length === 0 && <li>No bids yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
