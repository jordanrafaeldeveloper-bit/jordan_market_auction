import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PaymentRecordStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const instructions =
    process.env.BANK_TRANSFER_INSTRUCTIONS ??
    "Transfer the order total to the platform bank account. An administrator will confirm receipt and release contacts.";

  await prisma.paymentRecord.create({
    data: {
      orderId: id,
      provider: "bank_deposit",
      status: PaymentRecordStatus.PENDING,
    },
  });

  return NextResponse.json({
    instructions,
    amountCents: order.saleAmountCents,
    reference: id,
  });
}
