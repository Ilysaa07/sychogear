import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Attempt a basic query to test connectivity
    const productCount = await prisma.product.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        productCount,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error("Database diagnostic error:", error);
    
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 });
  }
}
