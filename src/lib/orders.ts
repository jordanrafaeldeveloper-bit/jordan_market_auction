import {
  ListingStatus,
  OrderStatus,
  OrderType,
  PaymentRecordStatus,
  SalesMethod,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCommissionCents, getCommissionSettings } from "@/lib/commission";
import {
  emailOrderCreatedBuyer,
  emailOrderCreatedSeller,
  emailPaidBuyer,
  emailPaidSeller,
} from "@/lib/email";

export async function createBuyNowOrder(listingId: string, buyerId: string) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new Error("Listing is not available");
    }
    if (
      listing.salesMethod !== SalesMethod.BUY_NOW_ONLY &&
      listing.salesMethod !== SalesMethod.BOTH
    ) {
      throw new Error("Buy now is not enabled for this listing");
    }
    if (listing.buyNowPriceCents == null) throw new Error("No buy-now price set");
    if (listing.sellerId === buyerId) throw new Error("You cannot buy your own item");

    const settings = await getCommissionSettings();
    const sale = listing.buyNowPriceCents;
    const commission = computeCommissionCents(sale, settings);
    const payout = sale - commission;

    const order = await tx.order.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        type: OrderType.BUY_NOW,
        status: OrderStatus.PENDING_PAYMENT,
        saleAmountCents: sale,
        commissionCents: commission,
        sellerPayoutCents: payout,
      },
      include: { buyer: true, seller: true, listing: true },
    });

    await tx.listing.update({
      where: { id: listing.id },
      data: { status: ListingStatus.SOLD },
    });

    await emailOrderCreatedBuyer({
      buyer: order.buyer,
      orderId: order.id,
      amountCents: order.saleAmountCents,
      listingTitle: order.listing.title,
    });
    await emailOrderCreatedSeller({
      seller: order.seller,
      orderId: order.id,
      amountCents: order.saleAmountCents,
      listingTitle: order.listing.title,
    });

    return order;
  });
}

export async function markOrderPaid(params: {
  orderId: string;
  paymentMethod: string;
  provider?: string;
  externalId?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { buyer: true, seller: true, listing: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    throw new Error("Order is not awaiting payment");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentMethod: params.paymentMethod,
      },
    }),
    prisma.paymentRecord.create({
      data: {
        orderId: order.id,
        provider: params.provider ?? params.paymentMethod,
        externalId: params.externalId,
        status: PaymentRecordStatus.COMPLETED,
      },
    }),
  ]);

  await emailPaidBuyer({
    buyer: order.buyer,
    seller: order.seller,
    orderId: order.id,
    listingTitle: order.listing.title,
  });
  await emailPaidSeller({
    seller: order.seller,
    buyer: order.buyer,
    orderId: order.id,
    listingTitle: order.listing.title,
  });
}
