import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listing-card";
import { closeExpiredAuctions } from "@/lib/auction";

export default async function ListingsPage() {
  await closeExpiredAuctions();
  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true, sellerRatingAvg: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">All listings</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={{ ...l, images: l.images as unknown }} />
        ))}
      </div>
      {listings.length === 0 && <p className="text-zinc-500">Nothing for sale right now.</p>}
    </div>
  );
}
