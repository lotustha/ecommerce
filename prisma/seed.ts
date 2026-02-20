import { createPool } from "mariadb";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";
import { prisma } from "@/lib/db/prisma";
// Explicitly load .env from the project root to ensure DB credentials are found
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});

async function main() {
  console.log("🌱 Starting seed...");

  // ==============================
  // 1. USERS & ROLES
  // ==============================
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalecom.com" },
    update: {},
    create: {
      email: "admin@nepalecom.com",
      name: "Super Admin",
      password,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  const customer = await prisma.user.upsert({
    where: { email: "customer@nepalecom.com" },
    update: {},
    create: {
      email: "customer@nepalecom.com",
      name: "Ram Bahadur",
      password,
      role: "USER",
      emailVerified: new Date(),
      addresses: {
        create: {
          province: "Bagmati",
          district: "Kathmandu",
          city: "Kathmandu",
          street: "New Road",
          phone: "9800000000",
          isDefault: true,
        },
      },
    },
  });
  console.log(`👤 Customer created: ${customer.email}`);

  const rider = await prisma.user.upsert({
    where: { email: "rider@nepalecom.com" },
    update: {},
    create: {
      email: "rider@nepalecom.com",
      name: "Fast Rider",
      password,
      role: "RIDER",
      emailVerified: new Date(),
    },
  });
  console.log(`👤 Rider created: ${rider.email}`);

  // ==============================
  // 2. CATALOG SETUP (Brands, Cats, Attributes)
  // ==============================

  // Brands
  const apple = await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {},
    create: { name: "Apple", slug: "apple" },
  });
  const samsung = await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {},
    create: { name: "Samsung", slug: "samsung" },
  });
  const goldstar = await prisma.brand.upsert({
    where: { slug: "goldstar" },
    update: {},
    create: { name: "Goldstar", slug: "goldstar" },
  });
  const sony = await prisma.brand.upsert({
    where: { slug: "sony" },
    update: {},
    create: { name: "Sony", slug: "sony" },
  });
  const northface = await prisma.brand.upsert({
    where: { slug: "north-face" },
    update: {},
    create: { name: "The North Face", slug: "north-face" },
  });

  // Categories
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const smartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      name: "Smartphones",
      slug: "smartphones",
      parentId: electronics.id,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: {
      name: "Accessories",
      slug: "accessories",
      parentId: electronics.id,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion", slug: "fashion" },
  });

  // Attributes
  const colorAttr = await prisma.attribute.upsert({
    where: { id: "attr_color" }, // minimizing collisions by hardcoding ID if needed
    update: {},
    create: { id: "attr_color", name: "Color" },
  });

  const storageAttr = await prisma.attribute.upsert({
    where: { id: "attr_storage" },
    update: {},
    create: { id: "attr_storage", name: "Storage" },
  });
  const sizeAttr = await prisma.attribute.upsert({
    where: { id: "attr_size" },
    update: {},
    create: { id: "attr_size", name: "Size" },
  });


  // ==============================
  // 4. MARKETING & LOGISTICS
  // ==============================

  // Coupons
  await prisma.coupon.upsert({
    where: { code: "NEPAL2081" },
    update: {},
    create: {
      code: "NEPAL2081",
      type: "PERCENTAGE",
      value: 10,
      maxDiscount: 1000,
      minOrder: 5000,
      expiresAt: new Date("2025-12-31"),
    },
  });
  console.log(`🎟️ Coupon created: NEPAL2081`);

  // Shipping Rates (Provinces)
  const shippingRates = [
    { province: "Bagmati", rate: 100 },
    { province: "Gandaki", rate: 150 },
    { province: "Lumbini", rate: 150 },
    { province: "Koshi", rate: 200 },
    { province: "Madhesh", rate: 200 },
    { province: "Karnali", rate: 300 },
    { province: "Sudurpashchim", rate: 300 },
  ];

  // We can't easily upsert shipping rates without a unique constraint on province,
  // so we'll just create them if the table is empty for this simplified seed
  const count = await prisma.shippingRate.count();
  if (count === 0) {
    await prisma.shippingRate.createMany({
      data: shippingRates,
    });
    console.log(`🚚 Shipping rates created`);
  }

  console.log("✅ Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
