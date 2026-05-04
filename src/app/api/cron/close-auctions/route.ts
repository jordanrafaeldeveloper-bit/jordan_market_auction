import { NextResponse } from "next/server";
import { closeExpiredAuctions } from "@/lib/auction";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const token = url.searchParams.get("secret") ?? req.headers.get("x-cron-secret");
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const summary = await closeExpiredAuctions();
  return NextResponse.json(summary);
}
