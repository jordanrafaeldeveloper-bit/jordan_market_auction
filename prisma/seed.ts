import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  ListingStatus,
  SalesMethod,
} from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required for seeding.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await prisma.commissionSettings.upsert({
    where: { id: "default" },
    create: { id: "default", mode: "PERCENTAGE", percentage: 5, fixedCents: 0 },
    update: {},
  });

  const adminPass = await bcrypt.hash("Admin123456!", 10);
  const userPass = await bcrypt.hash("User123456!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      passwordHash: adminPass,
      name: "Admin",
      role: Role.ADMIN,
    },
    update: { passwordHash: adminPass },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    create: {
      email: "seller@example.com",
      passwordHash: userPass,
      name: "Sam Seller",
      phone: "+962700000001",
    },
    update: {},
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    create: {
      email: "buyer@example.com",
      passwordHash: userPass,
      name: "Bill Buyer",
      phone: "+962700000002",
    },
    update: {},
  });

  const count = await prisma.listing.count();
  if (count === 0) {
    const ends = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: "Demo vintage camera",
        description: "Fully working 35mm camera with lens. Ships carefully packed.",
        images: ["https://images.unsplash.com/photo-1516035069371-29a1b244ccff?w=800"],
        minPriceCents: 5000,
        buyNowPriceCents: 12000,
        bidIncrementCents: 100,
        salesMethod: SalesMethod.BOTH,
        status: ListingStatus.ACTIVE,
        auctionEndsAt: ends,
        autoRelist: true,
      },
    });
  }

  console.log("Seed OK:", { admin: admin.email, seller: seller.email, buyer: buyer.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
