const base = () => process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials not configured");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function paypalCreateOrder(params: {
  orderId: string;
  amountCents: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const token = await accessToken();
  const value = (params.amountCents / 100).toFixed(2);
  const currency = process.env.PAYPAL_CURRENCY ?? "USD";
  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderId,
          description: params.description,
          amount: { currency_code: currency, value },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; links?: { href: string; rel: string }[] }>;
}

export async function paypalCaptureOrder(paypalOrderId: string) {
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; status: string }>;
}
