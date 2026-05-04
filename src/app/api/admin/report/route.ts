import { NextResponse } from "next/server";
import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return g.error;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] },
      paidAt: { not: null, gte: fromDate, lte: toDate },
    },
    select: {
      id: true,
      type: true,
      saleAmountCents: true,
      commissionCents: true,
      paidAt: true,
      listing: { select: { title: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const totalCommission = orders.reduce((s, o) => s + o.commissionCents, 0);
  const totalSales = orders.reduce((s, o) => s + o.saleAmountCents, 0);

  return NextResponse.json({
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    totalCommissionCents: totalCommission,
    totalSalesCents: totalSales,
    orderCount: orders.length,
    orders,
  });
}
