import nodemailer from "nodemailer";
import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function transport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function send(to: string, subject: string, text: string) {
  const from = process.env.MAIL_FROM ?? "noreply@localhost";
  const t = transport();
  if (!t) {
    console.info("[email skipped — configure SMTP]", { to, subject, text });
    return;
  }
  await t.sendMail({ from, to, subject, text });
}

export async function notifyNewListingSubscribers(params: {
  title: string;
  listingUrl: string;
}) {
  const subs = await prisma.subscriber.findMany({ where: { active: true } });
  for (const s of subs) {
    await send(
      s.email,
      "New listing on Jordan Market",
      `A new item was listed: ${params.title}\n\nView it: ${params.listingUrl}`,
    );
  }
}

export async function emailOrderCreatedBuyer(params: {
  buyer: Pick<User, "email" | "name">;
  orderId: string;
  amountCents: number;
  listingTitle: string;
}) {
  await send(
    params.buyer.email,
    "Order created — payment pending",
    `Hi ${params.buyer.name},\n\nYour order for "${params.listingTitle}" is pending payment.\nFinal price: ${(params.amountCents / 100).toFixed(2)}\nOrder ID: ${params.orderId}\n\nAfter payment is confirmed, you will receive the seller's contact details.`,
  );
}

export async function emailOrderCreatedSeller(params: {
  seller: Pick<User, "email" | "name">;
  orderId: string;
  amountCents: number;
  listingTitle: string;
}) {
  await send(
    params.seller.email,
    "You have a sale — payment pending",
    `Hi ${params.seller.name},\n\nYour item "${params.listingTitle}" sold.\nFinal price: ${(params.amountCents / 100).toFixed(2)}\nOrder ID: ${params.orderId}\n\nBuyer contact details will be sent once payment is received.`,
  );
}

export async function emailPaidBuyer(params: {
  buyer: Pick<User, "email" | "name">;
  seller: Pick<User, "name" | "email" | "phone">;
  orderId: string;
  listingTitle: string;
}) {
  await send(
    params.buyer.email,
    "Payment received — seller contact",
    `Hi ${params.buyer.name},\n\nPayment confirmed for "${params.listingTitle}".\n\nSeller: ${params.seller.name}\nEmail: ${params.seller.email}\nPhone: ${params.seller.phone ?? "—"}\nOrder ID: ${params.orderId}`,
  );
}

export async function emailPaidSeller(params: {
  seller: Pick<User, "email" | "name">;
  buyer: Pick<User, "name" | "email" | "phone">;
  orderId: string;
  listingTitle: string;
}) {
  await send(
    params.seller.email,
    "Payment received — buyer contact",
    `Hi ${params.seller.name},\n\nPayment confirmed for "${params.listingTitle}".\n\nBuyer: ${params.buyer.name}\nEmail: ${params.buyer.email}\nPhone: ${params.buyer.phone ?? "—"}\nOrder ID: ${params.orderId}`,
  );
}
