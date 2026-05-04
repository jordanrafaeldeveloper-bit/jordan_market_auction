import Link from "next/link";
import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listing-card";
import { closeExpiredAuctions } from "@/lib/auction";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export default async function HomePage() {
  await closeExpiredAuctions();
  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { seller: { select: { name: true, sellerRatingAvg: true } } },
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-800 px-8 py-14 text-white shadow-lg">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Sell physical items with auctions or instant buy
        </h1>
        <p className="mt-4 max-w-xl text-lg text-violet-100">
          Real-time bidding with sniping protection, auto-bid, configurable commission, and secure checkout options.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/listings"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-violet-800 shadow hover:bg-violet-50"
          >
            Browse listings
          </Link>
          <Link
            href="/sell"
            className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            List an item
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Featured listings</h2>
          <Link href="/listings" className="text-sm font-medium text-violet-700 hover:underline dark:text-violet-400">
            View all
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="text-zinc-500">No active listings yet. Be the first to sell.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={{ ...l, images: l.images as unknown }} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-semibold">New listing alerts</h3>
        <p className="mt-1 text-sm text-zinc-500">Subscribe with your email to hear when new products go live.</p>
        <form className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row" action={subscribeNewsletter}>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
