import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { closeExpiredAuctions } from "@/lib/auction";
import { ListingDetailClient } from "@/components/listing-detail-client";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await closeExpiredAuctions();
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, sellerRatingAvg: true } },
      bids: { orderBy: { createdAt: "desc" }, take: 30, include: { bidder: { select: { id: true, name: true } } } },
    },
  });
  if (!listing) notFound();

  return (
    <ListingDetailClient
      initial={{
        ...listing,
        auctionEndsAt: listing.auctionEndsAt?.toISOString() ?? null,
        bids: listing.bids.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
        })),
      }}
    />
  );
}
