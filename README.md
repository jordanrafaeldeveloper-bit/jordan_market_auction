# Jordan Market Auction

Next.js marketplace for **physical items** with **live auctions** (countdown, 5-minute sniping extension, proxy auto-bid), **buy now**, **configurable commission**, **reviews**, **email hooks**, and an **admin panel**. Payments: **PayPal**, **Mercado Pago** (checkout URL), **bank deposit** (admin confirms).

## Requirements

- Node.js 20+
- npm
- **PostgreSQL** (local Docker, [Neon](https://neon.tech), Vercel Postgres, Supabase, etc.). The app does **not** use SQLite on Vercel.

## Installation

1. Create a Postgres database and copy its connection string.

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   - `DATABASE_URL` — your `postgresql://…` URL (with `sslmode=require` for cloud hosts).
   - `AUTH_SECRET` — e.g. `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; on Vercel set to `https://YOUR-PROJECT.vercel.app`.
   - `CRON_SECRET`, payment keys, etc. as needed.

3. Install and generate the Prisma client:

   ```bash
   npm install
   ```

4. Apply migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Seed demo users and a sample listing:

   ```bash
   npm run db:seed
   ```

   - Admin: `admin@example.com` / `Admin123456!`
   - Seller: `seller@example.com` / `User123456!`
   - Buyer: `buyer@example.com` / `User123456!`

6. Run the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

The previous “server error” on Vercel was almost certainly **SQLite + `better-sqlite3`**, which do not work on Vercel’s serverless runtime. This repo now uses **PostgreSQL + `pg`**.

1. In Neon (or another host), create a database and copy the **pooled** connection string for `DATABASE_URL`.
2. In the Vercel project → **Settings → Environment Variables**, add at least:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` = `https://<your-deployment>.vercel.app`
   - `NEXT_PUBLIC_SITE_URL` = same as `NEXTAUTH_URL` (for emails/checkout return URLs)
   - `CRON_SECRET` (and optional payment/SMTP vars)
3. Redeploy. The included `vercel.json` runs **`prisma migrate deploy` then `next build`** so tables are created on build. (`npm install` runs `prisma generate` before env vars exist on Vercel; `prisma.config.ts` uses a placeholder URL only for that step—your real `DATABASE_URL` is still required for **`migrate deploy`** during the build.)
4. After the first successful deploy, run seed once from your machine (with production `DATABASE_URL` in env) or use Neon SQL / a one-off script: `npm run db:seed`.

## Production notes

- Set strong `AUTH_SECRET`, disable `ALLOW_SIMULATE_PAY`, configure SMTP for transactional mail.
- Schedule `GET /api/cron/close-auctions?secret=YOUR_CRON_SECRET` every minute (Vercel Cron or external ping) so ended auctions create orders, send emails, and relist when reserve is not met.

## Admin panel

Log in as `admin@example.com`, then open `/admin`:

- **Commission** — percentage, fixed cents, or both.
- **Report** — paid orders in the selected window with commission totals.
- **Users** — browse accounts and activity counts.

Bank-funded orders: buyer requests **Bank instructions** on the order page; admin opens the same order and uses **Mark paid** to trigger contact-exchange emails.

## Tests

```bash
npm test
```

Runs a small smoke check (commission math). Add load tests separately (e.g. k6) against `/api/listings/[id]/bid`.

## Project layout

- `src/lib/auction.ts` — bidding, sniping extension, auction close + relist.
- `src/lib/orders.ts` — buy now, mark paid, emails.
- `src/lib/paypal.ts` / `src/lib/mercadopago.ts` — gateway helpers.
- `prisma/schema.prisma` — data model.
