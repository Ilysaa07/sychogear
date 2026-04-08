import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log("\n👥 Current Admin Users:\n");
    console.log("─".repeat(60));
    admins.forEach(admin => {
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Name : ${admin.name}`);
        console.log(`🛡️ Role : ${admin.role}`);
        console.log(`📅 Created: ${admin.createdAt}`);
        console.log("─".repeat(60));
    });
  } catch (error) {
    console.error("Error listing admins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();
