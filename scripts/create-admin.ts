import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface AdminConfig {
  email: string;
  password: string;
  name: string;
}

function parseArgs(): Partial<AdminConfig> {
  const args = process.argv.slice(2);
  const config: Partial<AdminConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (!value) continue;

    switch (key) {
      case "--email":
      case "-e":
        config.email = value;
        break;
      case "--password":
      case "-p":
        config.password = value;
        break;
      case "--name":
      case "-n":
        config.name = value;
        break;
    }
  }

  return config;
}

function getAdminConfig(): AdminConfig {
  const cliArgs = parseArgs();

  const config: AdminConfig = {
    email: cliArgs.email || process.env.ADMIN_EMAIL || "admin@sychogear.com",
    password: cliArgs.password || process.env.ADMIN_PASSWORD || "admin123",
    name: cliArgs.name || process.env.ADMIN_NAME || "Admin",
  };

  return config;
}

async function createAdmin() {
  console.log("\n🔧 SychoGear — Create Admin User\n");
  console.log("─".repeat(40));

  const config = getAdminConfig();

  console.log(`📧 Email    : ${config.email}`);
  console.log(`👤 Name     : ${config.name}`);
  console.log(`🔑 Password : ${"*".repeat(config.password.length)}`);
  console.log("─".repeat(40));

  try {
    // Test database connection
    console.log("\n⏳ Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connected!\n");

    // Hash password
    console.log("⏳ Hashing password...");
    const hashedPassword = await bcrypt.hash(config.password, 12);
    console.log("✅ Password hashed!\n");

    // Upsert admin user
    console.log("⏳ Creating/updating admin user...");
    const user = await prisma.user.upsert({
      where: { email: config.email },
      update: {
        name: config.name,
        password: hashedPassword,
      },
      create: {
        email: config.email,
        name: config.name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("─".repeat(40));
    console.log(`  ID    : ${user.id}`);
    console.log(`  Email : ${user.email}`);
    console.log(`  Name  : ${user.name}`);
    console.log(`  Role  : ${user.role}`);
    console.log("─".repeat(40));
    console.log("\n🎉 Done! You can now login at /admin/login\n");
  } catch (error) {
    console.error("\n❌ Failed to create admin user:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🔧 SychoGear — Create Admin User

Usage:
  npx tsx scripts/create-admin.ts [options]

Options:
  --email, -e     Admin email (default: ADMIN_EMAIL env or admin@sychogear.com)
  --password, -p  Admin password (default: ADMIN_PASSWORD env or admin123)
  --name, -n      Admin name (default: ADMIN_NAME env or Admin)
  --help, -h      Show this help message

Environment Variables:
  ADMIN_EMAIL     Override default admin email
  ADMIN_PASSWORD  Override default admin password
  ADMIN_NAME      Override default admin name

Examples:
  npx tsx scripts/create-admin.ts
  npx tsx scripts/create-admin.ts --email admin@example.com --password secret123 --name "Super Admin"
  npm run create-admin
`);
  process.exit(0);
}

createAdmin();
