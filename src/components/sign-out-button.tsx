"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
    >
      Sign out
    </button>
  );
}
