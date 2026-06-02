import { prisma } from "@/lib/prisma";

export const customerRepository = {
  async findOrCreate(data: { email: string; name: string; phone?: string; address?: string }) {
    // Gunakan upsert atomic untuk menghindari race condition saat dua checkout
    // terjadi bersamaan dengan email yang sama (findUnique + create terpisah
    // bisa keduanya lolos ke create() → Unique constraint violation).
    return prisma.customer.upsert({
      where: { email: data.email },
      update: { name: data.name, phone: data.phone, address: data.address },
      create: data,
    });
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
