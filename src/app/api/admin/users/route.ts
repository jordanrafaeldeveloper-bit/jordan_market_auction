import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const g = await requireAdmin();
  if ("error" in g) return g.error;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
      sellerRatingAvg: true,
      buyerRatingAvg: true,
      _count: { select: { listings: true, ordersBuy: true, ordersSell: true } },
    },
    take: 200,
  });
  return NextResponse.json(users);
}
