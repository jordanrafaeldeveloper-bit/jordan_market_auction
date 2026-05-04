const api = () => process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

export async function createPreference(params: {
  title: string;
  orderId: string;
  amountCents: number;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Mercado Pago access token not configured");
  const amount = params.amountCents / 100;
  const res = await fetch(`${api()}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: params.title,
          quantity: 1,
          unit_price: amount,
          currency_id: process.env.MERCADOPAGO_CURRENCY ?? "USD",
        },
      ],
      external_reference: params.orderId,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      auto_return: "approved",
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago preference failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; init_point: string; sandbox_init_point?: string }>;
}
