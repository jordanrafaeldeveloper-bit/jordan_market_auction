import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/lib/mercadopago";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
  const success = new URL(`/orders/${order.id}/pay/return?provider=mercadopago`, site).toString();
  const failure = new URL(`/orders/${order.id}`, site).toString();
  try {
    const pref = await createPreference({
      title: order.listing.title,
      orderId: order.id,
      amountCents: order.saleAmountCents,
      successUrl: success,
      failureUrl: failure,
      pendingUrl: failure,
    });
    const url = pref.sandbox_init_point ?? pref.init_point;
    return NextResponse.json({ preferenceId: pref.id, initPoint: url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Mercado Pago error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
