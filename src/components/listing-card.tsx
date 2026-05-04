import Link from "next/link";
import { formatMoney } from "@/lib/money";

type Listing = {
  id: string;
  title: string;
  minPriceCents: number;
  buyNowPriceCents: number | null;
  currentBidCents: number | null;
  status: string;
  salesMethod: string;
  auctionEndsAt: string | Date | null;
  seller: { name: string; sellerRatingAvg: number };
  images: unknown;
};

function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images.length && typeof images[0] === "string") {
    return images[0];
  }
  return null;
}

export function ListingCard({ listing }: { listing: Listing }) {
  const img = firstImage(listing.images);
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-50">{listing.title}</h2>
        <p className="text-xs text-zinc-500">
          Seller {listing.seller.name} · ★ {listing.seller.sellerRatingAvg.toFixed(1)}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 text-sm">
          {(listing.salesMethod === "AUCTION_ONLY" || listing.salesMethod === "BOTH") && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              Bid from {formatMoney(listing.currentBidCents ?? listing.minPriceCents)}
            </span>
          )}
          {(listing.salesMethod === "BUY_NOW_ONLY" || listing.salesMethod === "BOTH") &&
            listing.buyNowPriceCents != null && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Buy {formatMoney(listing.buyNowPriceCents)}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}
