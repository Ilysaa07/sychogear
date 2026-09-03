import { prisma } from "@/lib/prisma";
import { calculatePercentageGrowth, getMonthName } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Jalankan semua query paralel — sebelumnya 3 query pertama dijalankan serial
    const [
      lifetimeRevenue,
      currentMonthRevenue,
      previousMonthRevenue,
      totalOrders,
      unpaidOrders,
      paidOrders,
      totalCustomers,
      yearOrders,
      totalProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: "PAID", createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: "PAID", createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "UNPAID" as any } }),
      prisma.order.count({ where: { status: "PAID" as any } }),
      prisma.customer.count(),
      // Batasi ke 2000 order untuk mencegah query tak terbatas saat data besar
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
        select: { createdAt: true, total: true, status: true },
        take: 2000,
      }),
      prisma.product.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          customerEmail: true,
          createdAt: true,
          status: true,
          total: true,
        },
      }),
    ]);

    const totalRevenue = lifetimeRevenue._sum.total || 0;
    const currentMonthTotal = currentMonthRevenue._sum.total || 0;
    const prevMonthTotal = previousMonthRevenue._sum.total || 0;

    // Initialize maps for all 12 months
    const revenueMap = new Map<number, number>();
    const ordersMap = new Map<number, number>();
    for (let i = 0; i < 12; i++) {
      revenueMap.set(i, 0);
      ordersMap.set(i, 0);
    }

    // Aggregate data
    yearOrders.forEach((order) => {
      const month = new Date(order.createdAt).getMonth();
      
      // Revenue chart only counts PAID orders
      if (order.status === "PAID") {
        revenueMap.set(month, (revenueMap.get(month) || 0) + order.total);
      }
      
      // Orders chart counts ALL orders
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
      previousRevenue: prevMonthTotal, // Used for growth calc in frontend usually, but here we return for consistency
      revenueGrowth: calculatePercentageGrowth(currentMonthTotal, prevMonthTotal),
      totalOrders,
      unpaidOrders,
      paidOrders,
      totalCustomers,
      totalProducts,
      recentOrders: recentOrders.map(o => ({
        ...o,
        email: o.customerEmail, // Mapping for frontend
        totalAmount: o.total // Mapping for frontend
      })),
      revenueByMonth,
      ordersByMonth,
    };
  },
};
