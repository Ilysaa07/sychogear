import { prisma } from "@/lib/prisma";
import type { ProductFilters } from "@/types";
import { Prisma } from "@prisma/client";

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
  variants: true,
  flashSale: true,
};

export const productRepository = {
  async findMany(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    const page = filters.page || 1;
    const limit = filters.limit || 12;

    if (filters.category) {
      where.category = { slug: filters.category };
    }
    if (filters.size) {
      where.variants = { some: { size: filters.size, stock: { gt: 0 } } };
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (filters.sort === "price-asc") orderBy = { price: "asc" };
    if (filters.sort === "price-desc") orderBy = { price: "desc" };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  },

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
  },

  async findFeatured(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, featured: true },
      include: productInclude,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },

  async findNewArrivals(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: productInclude,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },

  async findRelated(categoryId: string, productId: string, limit = 4) {
    return prisma.product.findMany({
      where: { categoryId, isActive: true, id: { not: productId } },
      include: productInclude,
      take: limit,
    });
  },

  async findAll() {
    return prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: productInclude });
  },

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  },

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  async decreaseStock(variantId: string, quantity: number) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { decrement: quantity } },
    });
  },
};
