import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Verifikasi bahwa request berasal dari admin yang terautentikasi.
 * FIX HIGH-5: Tambahkan role check eksplisit — cek session.user.role === "ADMIN"
 * agar jika di masa depan ada non-admin user, mereka tidak bisa akses admin API.
 *
 * Returns null jika authorized, atau NextResponse 401/403 jika tidak.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return null; // authorized
}
