import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const g = await requireAdmin();
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  try {
    await markOrderPaid({
      orderId: id,
      paymentMethod: "BANK_DEPOSIT",
      provider: "bank_manual",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
