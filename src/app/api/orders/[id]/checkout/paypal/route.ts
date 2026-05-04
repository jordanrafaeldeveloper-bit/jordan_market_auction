import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paypalCreateOrder } from "@/lib/paypal";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const returnUrl = new URL(`/orders/${order.id}/pay/return?provider=paypal`, site).toString();
  const cancelUrl = new URL(`/orders/${order.id}`, site).toString();
  try {
    const paypal = await paypalCreateOrder({
      orderId: order.id,
      amountCents: order.saleAmountCents,
      description: order.listing.title,
      returnUrl,
      cancelUrl,
    });
    const approve = paypal.links?.find((l) => l.rel === "approve")?.href;
    return NextResponse.json({ paypalOrderId: paypal.id, approveUrl: approve });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PayPal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
