import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ListingStatus, SalesMethod } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { publishListingNotify } from "@/lib/auction";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  imageUrls: z.array(z.string().min(1)).default([]),
  minPriceCents: z.number().int().positive(),
  buyNowPriceCents: z.number().int().positive().optional().nullable(),
  bidIncrementCents: z.number().int().positive().default(100),
  salesMethod: z.enum(["AUCTION_ONLY", "BUY_NOW_ONLY", "BOTH"]),
  auctionDurationHours: z.number().int().min(1).max(720).optional(),
  autoRelist: z.boolean().default(true),
  publish: z.boolean().default(false),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("status");
  const status =
    raw && (Object.values(ListingStatus) as string[]).includes(raw)
      ? (raw as ListingStatus)
      : ListingStatus.ACTIVE;
  const listings = await prisma.listing.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { id: true, name: true, sellerRatingAvg: true } } },
    take: 100,
  });
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const hours = body.auctionDurationHours ?? 72;
    const auctionEndsAt =
      body.salesMethod === SalesMethod.BUY_NOW_ONLY
        ? null
        : new Date(Date.now() + hours * 60 * 60 * 1000);

    const status = body.publish ? ListingStatus.ACTIVE : ListingStatus.DRAFT;

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title: body.title,
        description: body.description,
        images: body.imageUrls,
        minPriceCents: body.minPriceCents,
        buyNowPriceCents: body.buyNowPriceCents ?? null,
        bidIncrementCents: body.bidIncrementCents,
        salesMethod: body.salesMethod as SalesMethod,
        status,
        auctionEndsAt,
        autoRelist: body.autoRelist,
      },
    });

    if (body.publish) {
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      void publishListingNotify(listing.id, site);
    }

    return NextResponse.json(listing);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
