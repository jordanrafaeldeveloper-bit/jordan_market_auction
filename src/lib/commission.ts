import { prisma } from "@/lib/prisma";

export type CommissionMode = "PERCENTAGE" | "FIXED" | "BOTH";

export async function getCommissionSettings() {
  const row = await prisma.commissionSettings.findUnique({
    where: { id: "default" },
  });
  if (row) return row;
  return prisma.commissionSettings.create({
    data: {
      id: "default",
      mode: "PERCENTAGE",
      percentage: 5,
      fixedCents: 0,
    },
  });
}

export function computeCommissionCents(
  saleCents: number,
  settings: { mode: string; percentage: number; fixedCents: number },
) {
  const mode = settings.mode as CommissionMode;
  let commission = 0;
  if (mode === "PERCENTAGE" || mode === "BOTH") {
    commission += Math.floor((saleCents * settings.percentage) / 100);
  }
  if (mode === "FIXED" || mode === "BOTH") {
    commission += settings.fixedCents;
  }
  return Math.min(commission, saleCents);
}
