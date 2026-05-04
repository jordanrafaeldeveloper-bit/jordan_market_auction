import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

async function updateRatingsForUser(toUserId: string) {
  const [sellerAgg, buyerAgg] = await Promise.all([
    prisma.review.aggregate({
      where: { toUserId, order: { sellerId: toUserId } },
      _avg: { rating: true },
    }),
    prisma.review.aggregate({
      where: { toUserId, order: { buyerId: toUserId } },
      _avg: { rating: true },
    }),
  ]);
  await prisma.user.update({
    where: { id: toUserId },
    data: {
      sellerRatingAvg: sellerAgg._avg.rating ?? 0,
      buyerRatingAvg: buyerAgg._avg.rating ?? 0,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.COMPLETED) {
      return NextResponse.json({ error: "Order not eligible for review" }, { status: 400 });
    }
    const fromId = session.user.id;
    const toUserId = fromId === order.buyerId ? order.sellerId : order.buyerId;
    if (fromId !== order.buyerId && fromId !== order.sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        fromUserId: fromId,
        toUserId,
        rating: body.rating,
        comment: body.comment ?? "",
      },
    });

    await updateRatingsForUser(toUserId);

    return NextResponse.json(review);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "You already reviewed this order" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
