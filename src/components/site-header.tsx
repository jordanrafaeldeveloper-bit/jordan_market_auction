import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Jordan Market
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/listings" className="hover:text-zinc-900 dark:hover:text-white">
            Browse
          </Link>
          <Link href="/sell" className="hover:text-zinc-900 dark:hover:text-white">
            Sell
          </Link>
          {session?.user ? (
            <>
              <Link href="/account/orders" className="hover:text-zinc-900 dark:hover:text-white">
                My orders
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-amber-700 hover:text-amber-900 dark:text-amber-400">
                  Admin
                </Link>
              )}
              <span className="text-zinc-400">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
