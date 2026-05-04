import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { placeBid, closeExpiredAuctions } from "@/lib/auction";

const schema = z.object({
  amountCents: z.number().int().positive(),
  maxAutoCents: z.number().int().positive(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await closeExpiredAuctions();
  try {
    const body = schema.parse(await req.json());
    const maxAuto = Math.max(body.amountCents, body.maxAutoCents);
    const listing = await placeBid({
      listingId: id,
      userId: session.user.id,
      amountCents: body.amountCents,
      maxAutoCents: maxAuto,
    });
    return NextResponse.json(listing);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bid failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
