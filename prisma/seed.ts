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
  // 3. PRODUCTS
  // ==============================

  // Product 1: iPhone 15 (With Variants)
  const iphone = await prisma.product.upsert({
    where: { slug: "iphone-15-pro" },
    update: {},
    create: {
      name: "iPhone 15 Pro",
      slug: "iphone-15-pro",
      description: "The ultimate iPhone with Titanium design.",
      price: 185000,
      stock: 50,
      categoryId: smartphones.id,
      brandId: apple.id,
      hasVariants: true,
      isFeatured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=2070&auto=format&fit=crop",
      ]),
      variants: {
        create: [
          {
            sku: "IP15P-BLK-256",
            name: "Black Titanium / 256GB",
            price: 185000,
            stock: 20,
          },
          {
            sku: "IP15P-NAT-512",
            name: "Natural Titanium / 512GB",
            price: 210000,
            stock: 10,
          },
        ],
      },
      specs: {
        create: [
          { attributeId: colorAttr.id, value: "Black Titanium" },
          { attributeId: storageAttr.id, value: "256GB" },
        ],
      },
    },
  });
  console.log(`📦 Product created: ${iphone.name}`);

  // Product 2: Samsung S24 (Simple, no variants logic for demo)
  const s24 = await prisma.product.upsert({
    where: { slug: "samsung-s24" },
    update: {},
    create: {
      name: "Samsung Galaxy S24 Ultra",
      slug: "samsung-s24",
      description: "Galaxy AI is here.",
      price: 190000,
      stock: 30,
      categoryId: smartphones.id,
      brandId: samsung.id,
      hasVariants: false,
      isFeatured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1706606991536-e353922f254b?q=80&w=2070&auto=format&fit=crop",
      ]),
      specs: {
        create: [{ attributeId: storageAttr.id, value: "512GB" }],
      },
    },
  });
  console.log(`📦 Product created: ${s24.name}`);

  // Product 3: Goldstar Shoes
  const shoes = await prisma.product.upsert({
    where: { slug: "goldstar-032" },
    update: {},
    create: {
      name: "Goldstar 032 Classic",
      slug: "goldstar-032",
      description: "The legend of Nepal.",
      price: 900,
      stock: 100,
      categoryId: fashion.id,
      brandId: goldstar.id,
      hasVariants: true,
      images: JSON.stringify([
        "https://goldstarshoes.com/storage/photos/1/032/black.jpg",
      ]),
      variants: {
        create: [
          {
            sku: "GS-032-BLK-40",
            name: "Black / Size 40",
            price: 900,
            stock: 50,
          },
          {
            sku: "GS-032-BLK-42",
            name: "Black / Size 42",
            price: 900,
            stock: 50,
          },
        ],
      },
    },
  });
  console.log(`📦 Product created: ${shoes.name}`);

  // Product 4: Sony Headphones
  const headphones = await prisma.product.upsert({
    where: { slug: "sony-wh1000xm5" },
    update: {},
    create: {
      name: "Sony WH-1000XM5",
      slug: "sony-wh1000xm5",
      description: "Industry leading noise canceling headphones.",
      price: 55000,
      stock: 15,
      categoryId: accessories.id,
      brandId: sony.id,
      hasVariants: false,
      isFeatured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1610986603166-f78428624e76?q=80&w=2070&auto=format&fit=crop",
      ]),
      specs: {
        create: [{ attributeId: colorAttr.id, value: "Silver" }],
      },
    },
  });
  console.log(`📦 Product created: ${headphones.name}`);

  // Product 5: MacBook Air
  const macbook = await prisma.product.upsert({
    where: { slug: "macbook-air-m3" },
    update: {},
    create: {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "Lean. Mean. M3 machine.",
      price: 180000,
      stock: 10,
      categoryId: electronics.id,
      brandId: apple.id,
      hasVariants: true,
      isFeatured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=2052&auto=format&fit=crop",
      ]),
      variants: {
        create: [
          {
            sku: "MBA-M3-13-8-256",
            name: '13" / 8GB / 256GB',
            price: 180000,
            stock: 5,
          },
          {
            sku: "MBA-M3-15-16-512",
            name: '15" / 16GB / 512GB',
            price: 230000,
            stock: 5,
          },
        ],
      },
    },
  });
  console.log(`📦 Product created: ${macbook.name}`);

  // Product 6: North Face Jacket
  const jacket = await prisma.product.upsert({
    where: { slug: "tnf-nuptse-1996" },
    update: {},
    create: {
      name: "1996 Retro Nuptse Jacket",
      slug: "tnf-nuptse-1996",
      description: "Iconic boxy puffer jacket for the winter.",
      price: 35000,
      stock: 25,
      categoryId: fashion.id,
      brandId: northface.id,
      hasVariants: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1547635679-24b595ca1d56?q=80&w=2070&auto=format&fit=crop",
      ]),
      variants: {
        create: [
          { sku: "TNF-NUP-BLK-M", name: "Black / M", price: 35000, stock: 10 },
          { sku: "TNF-NUP-BLK-L", name: "Black / L", price: 35000, stock: 15 },
        ],
      },
      specs: {
        create: [{ attributeId: sizeAttr.id, value: "M, L" }],
      },
    },
  });
  console.log(`📦 Product created: ${jacket.name}`);

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
