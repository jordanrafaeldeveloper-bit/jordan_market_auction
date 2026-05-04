import {
  ListingStatus,
  OrderStatus,
  OrderType,
  SalesMethod,
} from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCommissionCents, getCommissionSettings } from "@/lib/commission";
import {
  emailOrderCreatedBuyer,
  emailOrderCreatedSeller,
  notifyNewListingSubscribers,
} from "@/lib/email";

const SNIPE_WINDOW_MS = 5 * 60 * 1000;
const SNIPE_EXTENSION_MS = 5 * 60 * 1000;

export type ProxyBidResult = {
  winnerId: string;
  newPrice: number;
  newLeaderMax: number;
};

/** English auction with proxy max; leader retains on exact tie. */
export function resolveProxyBid(input: {
  currentPrice: number | null;
  leaderId: string | null;
  leaderMax: number | null;
  challengerId: string;
  challengerAmount: number;
  challengerMax: number;
  minPrice: number;
  increment: number;
}): ProxyBidResult {
  const inc = input.increment;
  const chMax = Math.max(input.challengerAmount, input.challengerMax);

  if (!input.leaderId) {
    if (input.challengerAmount < input.minPrice) {
      throw new Error(`Opening bid must be at least ${(input.minPrice / 100).toFixed(2)}`);
    }
    return {
      winnerId: input.challengerId,
      newPrice: input.challengerAmount,
      newLeaderMax: chMax,
    };
  }

  if (input.leaderId === input.challengerId) {
    const price = input.currentPrice ?? input.minPrice;
    return {
      winnerId: input.challengerId,
      newPrice: price,
      newLeaderMax: Math.max(input.leaderMax ?? 0, chMax),
    };
  }

  const current = input.currentPrice ?? input.minPrice;
  const leaderMax = input.leaderMax ?? current;

  if (input.challengerAmount < current + inc) {
    throw new Error("Bid is below the minimum increment over the current price");
  }

  if (chMax > leaderMax) {
    const newPrice = leaderMax + inc;
    if (newPrice > chMax) {
      throw new Error("Your maximum must cover the next bid step to take the lead");
    }
    return {
      winnerId: input.challengerId,
      newPrice,
      newLeaderMax: chMax,
    };
  }

  if (chMax < leaderMax) {
    const newPrice = Math.min(leaderMax, chMax + inc);
    return {
      winnerId: input.leaderId,
      newPrice,
      newLeaderMax: leaderMax,
    };
  }

  return {
    winnerId: input.leaderId,
    newPrice: current,
    newLeaderMax: leaderMax,
  };
}

function maybeExtendAuction(endsAt: Date, now: Date) {
  const msLeft = endsAt.getTime() - now.getTime();
  if (msLeft <= SNIPE_WINDOW_MS) {
    return new Date(now.getTime() + SNIPE_EXTENSION_MS);
  }
  return endsAt;
}

export async function placeBid(params: {
  listingId: string;
  userId: string;
  amountCents: number;
  maxAutoCents: number;
}) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({ where: { id: params.listingId } });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new Error("Listing is not available for bidding");
    }
    if (
      listing.salesMethod !== SalesMethod.AUCTION_ONLY &&
      listing.salesMethod !== SalesMethod.BOTH
    ) {
      throw new Error("This listing does not accept auction bids");
    }
    if (!listing.auctionEndsAt) throw new Error("Auction has no end time");
    const now = new Date();
    if (listing.auctionEndsAt <= now) throw new Error("Auction has ended");

    if (listing.sellerId === params.userId) {
      throw new Error("You cannot bid on your own listing");
    }

    const nextEnds = maybeExtendAuction(listing.auctionEndsAt, now);

    const resolved = resolveProxyBid({
      currentPrice: listing.currentBidCents,
      leaderId: listing.leaderUserId,
      leaderMax: listing.leaderMaxBidCents,
      challengerId: params.userId,
      challengerAmount: params.amountCents,
      challengerMax: params.maxAutoCents,
      minPrice: listing.minPriceCents,
      increment: listing.bidIncrementCents,
    });

    await tx.bid.create({
      data: {
        listingId: listing.id,
        bidderId: params.userId,
        amountCents: params.amountCents,
        maxBidCents: params.maxAutoCents,
      },
    });

    const updated = await tx.listing.update({
      where: { id: listing.id },
      data: {
        auctionEndsAt: nextEnds,
        currentBidCents: resolved.newPrice,
        leaderUserId: resolved.winnerId,
        leaderMaxBidCents: resolved.newLeaderMax,
      },
    });

    return updated;
  });
}

async function createOrderFromSale(
  tx: Prisma.TransactionClient,
  input: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    type: OrderType;
    saleAmountCents: number;
  },
) {
  const settings = await getCommissionSettings();
  const commission = computeCommissionCents(input.saleAmountCents, settings);
  const payout = input.saleAmountCents - commission;

  const order = await tx.order.create({
    data: {
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      type: input.type,
      status: OrderStatus.PENDING_PAYMENT,
      saleAmountCents: input.saleAmountCents,
      commissionCents: commission,
      sellerPayoutCents: payout,
    },
    include: { buyer: true, seller: true, listing: true },
  });

  await tx.listing.update({
    where: { id: input.listingId },
    data: { status: ListingStatus.SOLD },
  });

  return order;
}

/** Close ended auctions: reserve met → order; else relist or ENDED_UNSOLD. */
export async function closeExpiredAuctions() {
  const now = new Date();
  const candidates = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      auctionEndsAt: { lte: now },
      OR: [{ salesMethod: SalesMethod.AUCTION_ONLY }, { salesMethod: SalesMethod.BOTH }],
    },
    include: { seller: true },
  });

  const summary = { closed: 0, orders: 0, relisted: 0, unsold: 0 };
  const emails: { orderId: string }[] = [];

  for (const listing of candidates) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const fresh = await tx.listing.findUnique({ where: { id: listing.id } });
        if (!fresh || fresh.status !== ListingStatus.ACTIVE || !fresh.auctionEndsAt) return null;
        if (fresh.auctionEndsAt > now) return null;

        const hasWinner =
          fresh.leaderUserId &&
          fresh.currentBidCents != null &&
          fresh.currentBidCents >= fresh.minPriceCents;

        if (hasWinner && fresh.leaderUserId) {
          const order = await createOrderFromSale(tx, {
            listingId: fresh.id,
            buyerId: fresh.leaderUserId,
            sellerId: fresh.sellerId,
            type: OrderType.AUCTION_WIN,
            saleAmountCents: fresh.currentBidCents!,
          });
          summary.orders += 1;
          return { kind: "sold" as const, orderId: order.id };
        }
        if (fresh.autoRelist) {
          await tx.listing.update({
            where: { id: fresh.id },
            data: { status: ListingStatus.ENDED_UNSOLD },
          });
          const ends = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await tx.listing.create({
            data: {
              sellerId: fresh.sellerId,
              title: fresh.title,
              description: fresh.description,
              images: fresh.images as Prisma.InputJsonValue,
              minPriceCents: fresh.minPriceCents,
              buyNowPriceCents: fresh.buyNowPriceCents,
              bidIncrementCents: fresh.bidIncrementCents,
              salesMethod: fresh.salesMethod,
              status: ListingStatus.ACTIVE,
              auctionEndsAt: ends,
              autoRelist: fresh.autoRelist,
              relistCount: fresh.relistCount + 1,
              parentListingId: fresh.parentListingId ?? fresh.id,
            },
          });
          summary.relisted += 1;
          return { kind: "relist" as const };
        }
        await tx.listing.update({
          where: { id: fresh.id },
          data: { status: ListingStatus.ENDED_UNSOLD },
        });
        summary.unsold += 1;
        return { kind: "unsold" as const };
      });
      if (outcome?.kind === "sold") emails.push({ orderId: outcome.orderId });
      if (outcome) summary.closed += 1;
    } catch (e) {
      console.error("closeExpiredAuctions item failed", listing.id, e);
    }
  }

  for (const { orderId } of emails) {
    const full = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, seller: true, listing: true },
    });
    if (full) {
      await emailOrderCreatedBuyer({
        buyer: full.buyer,
        orderId: full.id,
        amountCents: full.saleAmountCents,
        listingTitle: full.listing.title,
      });
      await emailOrderCreatedSeller({
        seller: full.seller,
        orderId: full.id,
        amountCents: full.saleAmountCents,
        listingTitle: full.listing.title,
      });
    }
  }

  return summary;
}

export async function publishListingNotify(listingId: string, siteUrl: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  const url = `${siteUrl.replace(/\/$/, "")}/listings/${listing.id}`;
  await notifyNewListingSubscribers({ title: listing.title, listingUrl: url });
}
