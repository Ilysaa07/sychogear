import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting Production Database Setup...");

  // 1. Truncate all tables
  console.log("🧹 Emptying all tables...");
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

  const tables = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log("✅ All tables emptied successfully.");
  } catch (error) {
    console.error("❌ Error truncating tables:", error);
    throw error;
  }

  // 2. Create fresh admin user
  console.log("👤 Creating new admin account...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sychogear.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin Production";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin created: ${adminEmail}`);

  // 3. Create mandatory categories
  console.log("📂 Creating mandatory categories...");
  const categories = [
    { name: "T-shirt", slug: "t-shirt" },
    { name: "Jackets", slug: "jackets" },
    { name: "Shorts", slug: "shorts" },
    { name: "Jersey", slug: "jersey" },
    { name: "Hoodies", slug: "hoodies" },
    { name: "Pants", slug: "pants" },
    { name: "Accessories", slug: "accessories" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categories initialized.");

  console.log("✨ Production setup completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
