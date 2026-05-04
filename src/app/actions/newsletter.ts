"use server";

import { prisma } from "@/lib/prisma";

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get("email")?.toString()?.trim();
  if (!email || !email.includes("@")) return;
  await prisma.subscriber.upsert({
    where: { email },
    create: { email, active: true },
    update: { active: true },
  });
}
