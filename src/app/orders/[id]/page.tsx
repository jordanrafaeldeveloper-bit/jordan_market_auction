import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { OrderPayPanel } from "@/components/order-pay-panel";
import { ReviewForm } from "@/components/review-form";
import { AdminConfirmOrder } from "@/components/admin-confirm-order";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      seller: { select: { id: true, name: true, email: true, phone: true } },
      reviews: { where: { fromUserId: session.user.id } },
    },
  });
  if (!order) notFound();
  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    notFound();
  }

  const isBuyer = order.buyerId === session.user.id;
  const showContacts = order.status === "PAID" || order.status === "COMPLETED";
  const allowSimulate = process.env.ALLOW_SIMULATE_PAY === "true";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Order</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{order.listing.title}</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <dt>Status</dt>
          <dd className="font-medium">{order.status}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sale amount</dt>
          <dd>{formatMoney(order.saleAmountCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Platform commission</dt>
          <dd>{formatMoney(order.commissionCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Seller receives (after commission)</dt>
          <dd>{formatMoney(order.sellerPayoutCents)}</dd>
        </div>
      </dl>

      {showContacts && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">Contact</h2>
          {isBuyer ? (
            <p className="mt-2">
              Seller: {order.seller.name}
              <br />
              {order.seller.email}
              <br />
              {order.seller.phone ?? "—"}
            </p>
          ) : (
            <p className="mt-2">
              Buyer: {order.buyer.name}
              <br />
              {order.buyer.email}
              <br />
              {order.buyer.phone ?? "—"}
            </p>
          )}
        </div>
      )}

      <OrderPayPanel
        orderId={order.id}
        isBuyer={isBuyer}
        status={order.status}
        saleAmountCents={order.saleAmountCents}
        allowSimulate={allowSimulate}
      />

      {session.user.role === "ADMIN" && order.status === "PENDING_PAYMENT" && <AdminConfirmOrder orderId={order.id} />}

      {showContacts && (
        <ReviewForm orderId={order.id} existingRating={order.reviews[0]?.rating} />
      )}
    </div>
  );
}
