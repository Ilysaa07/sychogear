import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const WIDGET_API_KEY = process.env.WIDGET_API_KEY || "sychogear_default_widget_key_123";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-widget-key");

    if (apiKey !== WIDGET_API_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get today's range
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total Revenue Today (Lifetime based on PAID orders for today)
    const paidOrdersToday = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startOfToday,
        },
      },
      select: {
        totalWithCode: true,
      },
    });

    const revenueToday = paidOrdersToday.reduce((sum, order) => sum + order.totalWithCode, 0);

    // 2. Unpaid Orders Count
    const unpaidCount = await prisma.order.count({
      where: {
        status: "UNPAID",
      },
    });

    // 3. Recent Orders (Last 5)
    const recentOrders = await prisma.order.findMany({
      where: {
         // Show any status for recent visibility
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        invoiceNumber: true,
        customerName: true,
        totalWithCode: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          revenueToday,
          unpaidCount,
        },
        recentOrders: recentOrders.map(o => ({
          ...o,
          totalFormatted: new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(o.totalWithCode),
          timeAgo: formatTimeAgo(o.createdAt),
        })),
      },
    });
  } catch (error) {
    console.error("Widget API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}
