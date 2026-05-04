"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";

function ReturnInner({ orderId }: { orderId: string }) {
  const sp = useSearchParams();
  const [status, setStatus] = useState("Processing…");

  useEffect(() => {
    const provider = sp.get("provider");
    const token = sp.get("token");
    if (provider === "paypal" && token) {
      void (async () => {
        const res = await fetch(`/api/orders/${orderId}/pay/capture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: token }),
        });
        if (res.ok) setStatus("Payment complete.");
        else setStatus("Payment capture failed — check your order page.");
      })();
    } else if (provider === "mercadopago") {
      setStatus("Mercado Pago: if payment is approved, confirm from order or webhook.");
    } else {
      setStatus("Return acknowledged.");
    }
  }, [orderId, sp]);

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <p>{status}</p>
      <Link href={`/orders/${orderId}`} className="text-violet-700 underline">
        View order
      </Link>
    </div>
  );
}

export default function PayReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <ReturnInner orderId={id} />
    </Suspense>
  );
}
