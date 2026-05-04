import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: uid }, { sellerId: uid }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, images: true } },
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      seller: { select: { id: true, name: true, email: true, phone: true } },
    },
    take: 50,
  });
  return NextResponse.json(orders);
}
