import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markOrderPaid } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

/** Dev / staging only: completes payment without a real gateway. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (process.env.ALLOW_SIMULATE_PAY !== "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await markOrderPaid({
      orderId: id,
      paymentMethod: "SIMULATED",
      provider: "simulate",
      externalId: `sim_${Date.now()}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
