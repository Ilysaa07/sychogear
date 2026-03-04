import { prisma } from "@/lib/prisma";
import { calculatePercentageGrowth, getMonthName } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Current month revenue
    const currentRevenue = await prisma.order.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });

    // Previous month revenue
    const previousRevenue = await prisma.order.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
      _sum: { total: true },
    });

    const totalRevenue = currentRevenue._sum.total || 0;
    const prevRevenue = previousRevenue._sum.total || 0;

    // Total orders
    const [totalOrders, pendingOrders, paidOrders, totalCustomers] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "PAID" } }),
        prisma.customer.count(),
      ]);

    // Revenue by month (current year)
    const monthlyRevenue = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      _sum: { total: true },
    });

    // Aggregate by month
    const revenueMap = new Map<number, number>();
    const ordersMap = new Map<number, number>();

    monthlyRevenue.forEach((item: { createdAt: Date, _sum: { total: number | null } }) => {
      const month = new Date(item.createdAt).getMonth();
      revenueMap.set(month, (revenueMap.get(month) || 0) + (item._sum.total || 0));
      ordersMap.set(month, (ordersMap.get(month) || 0) + 1);
    });

    const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      revenue: revenueMap.get(i) || 0,
    }));

    const ordersByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      orders: ordersMap.get(i) || 0,
    }));

    return {
      totalRevenue,
      previousRevenue: prevRevenue,
      revenueGrowth: calculatePercentageGrowth(totalRevenue, prevRevenue),
      totalOrders,
      pendingOrders,
      paidOrders,
      totalCustomers,
      revenueByMonth,
      ordersByMonth,
    };
  },
};
