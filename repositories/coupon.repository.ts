import { prisma } from "@/lib/prisma";

export const couponRepository = {
  async findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  async findAll() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  },

  async create(data: {
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    isActive?: boolean;
    expiresAt?: Date | null;
  }) {
    return prisma.coupon.create({ data });
  },

  async update(id: string, data: Partial<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: number;
    maxDiscount: number | null;
    usageLimit: number | null;
    isActive: boolean;
    expiresAt: Date | null;
  }>) {
    return prisma.coupon.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.coupon.delete({ where: { id } });
  },

  async incrementUsage(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  },

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return { valid: false, error: "Kupon tidak ditemukan" };
    if (!coupon.isActive) return { valid: false, error: "Kupon tidak aktif" };
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return { valid: false, error: "Kupon sudah kadaluarsa" };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
      return { valid: false, error: "Kupon sudah mencapai batas penggunaan" };
    if (subtotal < coupon.minPurchase)
      return { valid: false, error: `Minimal pembelian Rp ${coupon.minPurchase.toLocaleString()}` };

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    return { valid: true, coupon, discount };
  },
};
