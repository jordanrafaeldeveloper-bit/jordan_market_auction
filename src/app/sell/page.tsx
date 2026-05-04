import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SellForm } from "./sell-form";

export default async function SellPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/sell");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">List an item</h1>
      <p className="mb-8 text-zinc-500">Set a reserve, choose auction and/or buy now, and publish when ready.</p>
      <SellForm />
    </div>
  );
}
