import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paypalCaptureOrder } from "@/lib/paypal";
import { markOrderPaid } from "@/lib/orders";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const paypalOrderId = body.paypalOrderId as string | undefined;
  if (!paypalOrderId) {
    return NextResponse.json({ error: "paypalOrderId required" }, { status: 400 });
  }
  try {
    const cap = await paypalCaptureOrder(paypalOrderId);
    if (cap.status !== "COMPLETED") {
      return NextResponse.json({ error: "Capture not completed", cap }, { status: 400 });
    }
    await markOrderPaid({
      orderId: id,
      paymentMethod: "PAYPAL",
      provider: "paypal",
      externalId: cap.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
