import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { id: true, title: true } } },
    take: 50,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My orders</h1>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium">{o.listing.title}</span>
              <span className="text-sm text-zinc-500">
                {o.buyerId === session.user.id ? "You bought" : "You sold"} · {formatMoney(o.saleAmountCents)} ·{" "}
                {o.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="text-zinc-500">No orders yet.</p>}
    </div>
  );
}
