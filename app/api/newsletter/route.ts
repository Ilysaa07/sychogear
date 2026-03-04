import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = newsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: validation.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    await prisma.newsletterSubscriber.create({
      data: { email: validation.data.email },
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil berlangganan newsletter",
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal berlangganan" },
      { status: 500 }
    );
  }
}
