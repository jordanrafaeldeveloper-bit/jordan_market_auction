# Jordan Market Auction

Next.js marketplace for **physical items** with **live auctions** (countdown, 5-minute sniping extension, proxy auto-bid), **buy now**, **configurable commission**, **reviews**, **email hooks**, and an **admin panel**. Payments: **PayPal**, **Mercado Pago** (checkout URL), **bank deposit** (admin confirms).

## Requirements

- Node.js 20+
- npm

## Installation

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Set `AUTH_SECRET` (e.g. `openssl rand -base64 32`), `CRON_SECRET`, and payment keys as needed.

2. Install and generate the Prisma client:

   ```bash
   npm install
   ```

3. Create / migrate the database (SQLite file `dev.db` in project root by default):

   ```bash
   npx prisma migrate deploy
   ```

4. Seed demo users and a sample listing:

   ```bash
   npm run db:seed
   ```

   - Admin: `admin@example.com` / `Admin123456!`
   - Seller: `seller@example.com` / `User123456!`
   - Buyer: `buyer@example.com` / `User123456!`

5. Run the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Production notes

- Switch `DATABASE_URL` to **PostgreSQL** (recommended): change `provider` in `prisma/schema.prisma`, run migrations, and use a Postgres-compatible Prisma adapter per [Prisma 7 docs](https://www.prisma.io/docs).
- Set strong `AUTH_SECRET`, disable `ALLOW_SIMULATE_PAY`, configure SMTP for transactional mail.
- Schedule `GET /api/cron/close-auctions?secret=YOUR_CRON_SECRET` every minute (or use Vercel Cron / systemd) so ended auctions create orders, send emails, and relist when reserve is not met.

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
