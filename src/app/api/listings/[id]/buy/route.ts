import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { closeExpiredAuctions } from "@/lib/auction";
import { createBuyNowOrder } from "@/lib/orders";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await closeExpiredAuctions();
  try {
    const order = await createBuyNowOrder(id, session.user.id);
    return NextResponse.json(order);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Purchase failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
