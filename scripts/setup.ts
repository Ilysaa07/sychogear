import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────

function log(emoji: string, message: string) {
  console.log(`  ${emoji} ${message}`);
}

function header(title: string) {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(50)}\n`);
}

function step(num: number, title: string) {
  console.log(`\n── Step ${num}: ${title} ${"─".repeat(Math.max(0, 35 - title.length))}\n`);
}

function runCommand(command: string): boolean {
  try {
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
    return true;
  } catch {
    return false;
  }
}

// ─── Steps ──────────────────────────────────────────────────

async function checkDatabaseConnection(): Promise<boolean> {
  step(1, "Database Connection");

  try {
    log("⏳", "Testing database connection...");
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    log("✅", "Database connection successful!");
    return true;
  } catch (error) {
    log("❌", "Database connection failed!");
    if (error instanceof Error) {
      log("  ", `Error: ${error.message}`);
    }
    log("💡", "Make sure DATABASE_URL is set correctly in .env");
    log("💡", "For local development, run: docker-compose up -d");
    return false;
  }
}

async function pushDatabaseSchema(): Promise<boolean> {
  step(2, "Database Schema");

  log("⏳", "Pushing Prisma schema to database...");
  const success = runCommand("npx prisma db push");

  if (success) {
    log("✅", "Database schema pushed successfully!");
  } else {
    log("❌", "Failed to push database schema!");
    log("💡", "Check your DATABASE_URL and try running: npx prisma db push");
  }

  return success;
}

async function generatePrismaClient(): Promise<boolean> {
  step(3, "Prisma Client");

  log("⏳", "Generating Prisma client...");
  const success = runCommand("npx prisma generate");

  if (success) {
    log("✅", "Prisma client generated successfully!");
  } else {
    log("❌", "Failed to generate Prisma client!");
  }

  return success;
}

async function createAdminUser(): Promise<boolean> {
  step(4, "Admin User");

  const email = process.env.ADMIN_EMAIL || "admin@sychogear.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";

  log("⏳", "Creating admin user...");
  log("📧", `Email: ${email}`);
  log("👤", `Name: ${name}`);

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    log("✅", `Admin user ready! (ID: ${user.id})`);
    return true;
  } catch (error) {
    log("❌", "Failed to create admin user!");
    if (error instanceof Error) {
      log("  ", `Error: ${error.message}`);
    }
    return false;
  }
}

async function seedSampleData(): Promise<boolean> {
  step(5, "Sample Data");

  log("⏳", "Seeding sample data (categories, products, coupons)...");

  try {
    // Categories
    const categories = [
      { name: "Hoodies", slug: "hoodies" },
      { name: "T-Shirts", slug: "t-shirts" },
      { name: "Jackets", slug: "jackets" },
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
    log("✅", `${categories.length} categories ready!`);

    // Products
    const hoodiesCat = await prisma.category.findUnique({ where: { slug: "hoodies" } });
    const tshirtsCat = await prisma.category.findUnique({ where: { slug: "t-shirts" } });
    const jacketsCat = await prisma.category.findUnique({ where: { slug: "jackets" } });

    if (hoodiesCat && tshirtsCat && jacketsCat) {
      const products = [
        {
          name: "Essentials Oversized Hoodie",
          slug: "essentials-oversized-hoodie",
          description: "Premium heavyweight 400gsm cotton hoodie with an oversized silhouette. Features a kangaroo pocket, ribbed cuffs and hem, and a bold logo print on the back.",
          price: 599000,
          categoryId: hoodiesCat.id,
          featured: true,
          isNew: true,
          images: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
            "https://images.unsplash.com/photo-1578768079470-62f67e03bc42?w=800",
          ],
          variants: [
            { size: "S", stock: 15 },
            { size: "M", stock: 25 },
            { size: "L", stock: 20 },
            { size: "XL", stock: 10 },
          ],
        },
        {
          name: "Phantom Black Tee",
          slug: "phantom-black-tee",
          description: "Heavyweight 280gsm cotton t-shirt in pitch black. Relaxed fit with dropped shoulders. Minimal branding with embossed logo on chest.",
          price: 349000,
          categoryId: tshirtsCat.id,
          featured: true,
          isNew: true,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
          ],
          variants: [
            { size: "S", stock: 30 },
            { size: "M", stock: 40 },
            { size: "L", stock: 35 },
            { size: "XL", stock: 20 },
            { size: "XXL", stock: 10 },
          ],
        },
        {
          name: "Urban Cargo Jacket",
          slug: "urban-cargo-jacket",
          description: "Technical cargo jacket with water-resistant shell fabric. Multiple utility pockets, adjustable hood, and snap-button closure.",
          price: 899000,
          salePrice: 749000,
          categoryId: jacketsCat.id,
          featured: true,
          isNew: false,
          images: [
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
            "https://images.unsplash.com/photo-1544923246-77307dd270b5?w=800",
          ],
          variants: [
            { size: "M", stock: 12 },
            { size: "L", stock: 15 },
            { size: "XL", stock: 8 },
          ],
        },
        {
          name: "Midnight Graphic Tee",
          slug: "midnight-graphic-tee",
          description: "Premium 280gsm tee featuring exclusive hand-drawn graphics. Boxy fit with reinforced collar.",
          price: 399000,
          categoryId: tshirtsCat.id,
          featured: false,
          isNew: true,
          images: [
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
          ],
          variants: [
            { size: "S", stock: 20 },
            { size: "M", stock: 30 },
            { size: "L", stock: 25 },
            { size: "XL", stock: 15 },
          ],
        },
        {
          name: "Shadow Zip-Up Hoodie",
          slug: "shadow-zip-up-hoodie",
          description: "Full-zip hoodie crafted from 380gsm French terry cotton. Features a two-way zipper, side pockets, and tonal embroidered logo.",
          price: 549000,
          categoryId: hoodiesCat.id,
          featured: true,
          isNew: false,
          images: [
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
          ],
          variants: [
            { size: "M", stock: 18 },
            { size: "L", stock: 22 },
            { size: "XL", stock: 12 },
          ],
        },
        {
          name: "Stealth Windbreaker",
          slug: "stealth-windbreaker",
          description: "Lightweight windbreaker with matte-finish shell. Packable design with a hidden hood. Reflective details for visibility.",
          price: 699000,
          categoryId: jacketsCat.id,
          featured: false,
          isNew: true,
          images: [
            "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800",
          ],
          variants: [
            { size: "S", stock: 10 },
            { size: "M", stock: 15 },
            { size: "L", stock: 15 },
            { size: "XL", stock: 8 },
          ],
        },
      ];

      let productCount = 0;
      for (const product of products) {
        const existing = await prisma.product.findUnique({
          where: { slug: product.slug },
        });
        if (!existing) {
          await prisma.product.create({
            data: {
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price,
              salePrice: product.salePrice || null,
              categoryId: product.categoryId,
              featured: product.featured,
              isNew: product.isNew,
              images: {
                create: product.images.map((url, i) => ({
                  url,
                  alt: product.name,
                  position: i,
                })),
              },
              variants: {
                create: product.variants,
              },
            },
          });
          productCount++;
        }
      }
      log("✅", `${productCount} new products created! (${products.length - productCount} already existed)`);
    }

    // Coupon
    await prisma.coupon.upsert({
      where: { code: "WELCOME20" },
      update: {},
      create: {
        code: "WELCOME20",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minPurchase: 300000,
        maxDiscount: 100000,
        usageLimit: 100,
        isActive: true,
      },
    });
    log("✅", "Sample coupon (WELCOME20) ready!");

    return true;
  } catch (error) {
    log("❌", "Failed to seed sample data!");
    if (error instanceof Error) {
      log("  ", `Error: ${error.message}`);
    }
    return false;
  }
}

// ─── Main ───────────────────────────────────────────────────

async function setup() {
  header("🚀 SychoGear — Project Setup");

  const results: { step: string; success: boolean }[] = [];

  // Step 1: Check database connection
  const dbConnected = await checkDatabaseConnection();
  results.push({ step: "Database Connection", success: dbConnected });
  if (!dbConnected) {
    console.log("\n⚠️  Cannot proceed without database connection. Fix the issue above and try again.\n");
    process.exit(1);
  }

  // Step 2: Push database schema
  const schemaPushed = await pushDatabaseSchema();
  results.push({ step: "Database Schema", success: schemaPushed });
  if (!schemaPushed) {
    console.log("\n⚠️  Cannot proceed without database schema. Fix the issue above and try again.\n");
    process.exit(1);
  }

  // Step 3: Generate Prisma client
  const clientGenerated = await generatePrismaClient();
  results.push({ step: "Prisma Client", success: clientGenerated });

  // Step 4: Create admin user
  const adminCreated = await createAdminUser();
  results.push({ step: "Admin User", success: adminCreated });

  // Step 5: Seed sample data
  const dataSeeded = await seedSampleData();
  results.push({ step: "Sample Data", success: dataSeeded });

  // Summary
  header("📋 Setup Summary");
  for (const result of results) {
    const icon = result.success ? "✅" : "❌";
    console.log(`  ${icon} ${result.step}`);
  }

  const allSuccess = results.every((r) => r.success);
  if (allSuccess) {
    console.log(`\n${"─".repeat(50)}`);
    console.log("  🎉 Setup complete! Here's what to do next:\n");
    console.log("  1. Start the dev server:  npm run dev");
    console.log("  2. Open admin panel:      http://localhost:3000/admin/login");
    console.log(`  3. Login with:            ${process.env.ADMIN_EMAIL || "admin@sychogear.com"}`);
    console.log(`${"─".repeat(50)}\n`);
  } else {
    console.log("\n⚠️  Some steps failed. Please fix the issues above and run setup again.\n");
    process.exit(1);
  }
}

setup()
  .catch((e) => {
    console.error("\n❌ Setup failed unexpectedly:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
