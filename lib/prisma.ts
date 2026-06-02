import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless: setiap function instance hanya butuh 1 koneksi.
    // Nilai max: 10 sebelumnya menyebabkan "too many connections" di Supabase
    // karena Vercel bisa spawn banyak instance secara paralel (N instance × 10 = overflow).
    max: 1,
    // Tutup koneksi idle lebih cepat agar slot di Supabase cepat dibebaskan.
    idleTimeoutMillis: 10000,
    // Naikkan dari 2000 → 10000 ms agar tidak langsung timeout
    // saat Supabase pooler sedang sibuk melayani request lain.
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Cache instance di globalThis untuk semua environment (dev & production).
// Sebelumnya hanya di-cache saat NODE_ENV !== "production", sehingga setiap
// cold start di Vercel membuat PrismaClient baru → Pool baru → koneksi baru.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
