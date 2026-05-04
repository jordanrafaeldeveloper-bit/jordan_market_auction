import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administration</h1>
      <ul className="space-y-2 text-violet-700 dark:text-violet-400">
        <li>
          <Link href="/admin/commission" className="underline">
            Commission settings
          </Link>
        </li>
        <li>
          <Link href="/admin/report" className="underline">
            Commission report
          </Link>
        </li>
        <li>
          <Link href="/admin/users" className="underline">
            Users
          </Link>
        </li>
      </ul>
      <p className="text-sm text-zinc-500">
        Schedule <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GET /api/cron/close-auctions?secret=…</code>{" "}
        (set <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CRON_SECRET</code>) to close auctions and send
        emails.
      </p>
    </div>
  );
}
