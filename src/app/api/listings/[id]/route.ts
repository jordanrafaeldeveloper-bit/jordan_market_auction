import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closeExpiredAuctions } from "@/lib/auction";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await closeExpiredAuctions();
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, sellerRatingAvg: true, createdAt: true } },
      bids: { orderBy: { createdAt: "desc" }, take: 30, include: { bidder: { select: { name: true, id: true } } } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}
