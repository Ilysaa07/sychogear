import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const orderInclude = {
  customer: true,
  items: {
    include: {
      product: {
        include: { images: { take: 1, orderBy: { position: "asc" as const } } },
      },
      variant: true,
    },
  },
  payment: true,
  coupon: true,
};

export const orderRepository = {
  async findMany(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: Prisma.OrderWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as Prisma.EnumOrderStatusFilter["equals"];
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  },

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  },

  async findByInvoiceNumber(invoiceNumber: string) {
    return prisma.order.findUnique({ where: { invoiceNumber }, include: orderInclude });
  },

  async findByEmailAndInvoiceNumber(email: string, invoiceNumber: string) {
    return prisma.order.findFirst({
      where: {
        invoiceNumber,
        customer: { email },
      },
      include: orderInclude,
    });
  },

  async create(data: {
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    customerId: string;
    subtotal: number;
    taxPpn: number;
    taxPph23: number;
    totalDiscount: number;
    discount: number;
    uniqueCode: number;
    totalWithCode: number;
    total: number;
    couponId?: string;
    expiredAt: Date;
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      price: number;
      size: string;
      ppnAmount: number;
      pph23Amount: number;
      discountAmount: number;
    }>;
  }) {
    return prisma.order.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerId: data.customerId,
        subtotal: data.subtotal,
        taxPpn: data.taxPpn,
        taxPph23: data.taxPph23,
        totalDiscount: data.totalDiscount,
        discount: data.discount,
        uniqueCode: data.uniqueCode,
        totalWithCode: data.totalWithCode,
        total: data.total,
        couponId: data.couponId,
        expiredAt: data.expiredAt,
        items: {
          create: data.items,
        },
      },
      include: orderInclude,
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as Prisma.EnumOrderStatusFieldUpdateOperationsInput["set"] },
      include: orderInclude,
    });
  },

  async getMonthlyOrders(year: number) {
    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: { createdAt: true },
    });
    return orders;
  },
};
