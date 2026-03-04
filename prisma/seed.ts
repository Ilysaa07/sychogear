import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user (reads from env vars with fallback defaults)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sychogear.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create categories
  const categories = [
    { name: "Hoodies", slug: "hoodies" },
    { name: "T-Shirts", slug: "t-shirts" },
    { name: "Jackets", slug: "jackets" },
    { name: "Pants", slug: "pants" },
    { name: "Accessories", slug: "accessories" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Create sample products
  const hoodiesCat = await prisma.category.findUnique({
    where: { slug: "hoodies" },
  });
  const tshirtsCat = await prisma.category.findUnique({
    where: { slug: "t-shirts" },
  });
  const jacketsCat = await prisma.category.findUnique({
    where: { slug: "jackets" },
  });

  if (hoodiesCat && tshirtsCat && jacketsCat) {
    const products = [
      {
        name: "Essentials Oversized Hoodie",
        slug: "essentials-oversized-hoodie",
        description:
          "Premium heavyweight 400gsm cotton hoodie with an oversized silhouette. Features a kangaroo pocket, ribbed cuffs and hem, and a bold logo print on the back. Designed for comfort and style.",
        price: 599000,
        categoryId: hoodiesCat.id,
        featured: true,
        isNew: true,
        images: [
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
          "https://images.unsplash.com/photo-1578768079470-62f67e03bc42?w=800",
        ],
        variants: [
          { size: "S", stock: 15 },
          { size: "M", stock: 25 },
          { size: "L", stock: 20 },
          { size: "XL", stock: 10 },
        ],
      },
      {
        name: "Phantom Black Tee",
        slug: "phantom-black-tee",
        description:
          "Heavyweight 280gsm cotton t-shirt in pitch black. Relaxed fit with dropped shoulders. Minimal branding with embossed logo on chest. The perfect staple for any streetwear wardrobe.",
        price: 349000,
        categoryId: tshirtsCat.id,
        featured: true,
        isNew: true,
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
        ],
        variants: [
          { size: "S", stock: 30 },
          { size: "M", stock: 40 },
          { size: "L", stock: 35 },
          { size: "XL", stock: 20 },
          { size: "XXL", stock: 10 },
        ],
      },
      {
        name: "Urban Cargo Jacket",
        slug: "urban-cargo-jacket",
        description:
          "Technical cargo jacket with water-resistant shell fabric. Multiple utility pockets, adjustable hood, and snap-button closure. Oversized fit with a modern streetwear silhouette.",
        price: 899000,
        salePrice: 749000,
        categoryId: jacketsCat.id,
        featured: true,
        isNew: false,
        images: [
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
          "https://images.unsplash.com/photo-1544923246-77307dd270b5?w=800",
        ],
        variants: [
          { size: "M", stock: 12 },
          { size: "L", stock: 15 },
          { size: "XL", stock: 8 },
        ],
      },
      {
        name: "Midnight Graphic Tee",
        slug: "midnight-graphic-tee",
        description:
          "Premium 280gsm tee featuring exclusive hand-drawn graphics. Screen-printed artwork that tells a story. Boxy fit with reinforced collar.",
        price: 399000,
        categoryId: tshirtsCat.id,
        featured: false,
        isNew: true,
        images: [
          "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
        ],
        variants: [
          { size: "S", stock: 20 },
          { size: "M", stock: 30 },
          { size: "L", stock: 25 },
          { size: "XL", stock: 15 },
        ],
      },
      {
        name: "Shadow Zip-Up Hoodie",
        slug: "shadow-zip-up-hoodie",
        description:
          "Full-zip hoodie crafted from 380gsm French terry cotton. Features a two-way zipper, side pockets, and tonal embroidered logo. Garment-dyed for a lived-in look.",
        price: 549000,
        categoryId: hoodiesCat.id,
        featured: true,
        isNew: false,
        images: [
          "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
        ],
        variants: [
          { size: "M", stock: 18 },
          { size: "L", stock: 22 },
          { size: "XL", stock: 12 },
        ],
      },
      {
        name: "Stealth Windbreaker",
        slug: "stealth-windbreaker",
        description:
          "Lightweight windbreaker with matte-finish shell. Packable design with a hidden hood. Reflective details for visibility. Perfect layering piece for transitional weather.",
        price: 699000,
        categoryId: jacketsCat.id,
        featured: false,
        isNew: true,
        images: [
          "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800",
        ],
        variants: [
          { size: "S", stock: 10 },
          { size: "M", stock: 15 },
          { size: "L", stock: 15 },
          { size: "XL", stock: 8 },
        ],
      },
    ];

    for (const product of products) {
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice || null,
            categoryId: product.categoryId,
            featured: product.featured,
            isNew: product.isNew,
            images: {
              create: product.images.map((url, i) => ({
                url,
                alt: product.name,
                position: i,
              })),
            },
            variants: {
              create: product.variants,
            },
          },
        });
      }
    }
  }

  // Create sample coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minPurchase: 300000,
      maxDiscount: 100000,
      usageLimit: 100,
      isActive: true,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
