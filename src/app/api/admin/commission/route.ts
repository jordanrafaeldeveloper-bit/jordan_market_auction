import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const g = await requireAdmin();
  if ("error" in g) return g.error;
  const settings = await prisma.commissionSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json(settings);
}

const patchSchema = z.object({
  mode: z.enum(["PERCENTAGE", "FIXED", "BOTH"]),
  percentage: z.number().min(0).max(100),
  fixedCents: z.number().int().min(0),
});

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return g.error;
  try {
    const body = patchSchema.parse(await req.json());
    const settings = await prisma.commissionSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...body },
      update: body,
    });
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
