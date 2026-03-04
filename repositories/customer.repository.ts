import { prisma } from "@/lib/prisma";

export const customerRepository = {
  async findOrCreate(data: { email: string; name: string; phone?: string; address?: string }) {
    const existing = await prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: { name: data.name, phone: data.phone, address: data.address },
      });
    }

    return prisma.customer.create({ data });
  },

  async findAll() {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          where: { status: "PAID" },
          select: { total: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return customers.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      phone: c.phone,
      address: c.address,
      createdAt: c.createdAt,
      totalSpending: c.orders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: c._count.orders,
    }));
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: { include: { product: true } },
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
};
