import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user (reads from env vars with fallback defaults)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sychogear.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create categories
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

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
