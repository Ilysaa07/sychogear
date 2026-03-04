import { z } from "zod";

// Checkout form validation
export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  couponCode: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Product form validation
export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  price: z.number().min(1000, "Harga minimal Rp 1.000"),
  salePrice: z.number().optional().nullable(),
  categoryId: z.string().min(1, "Pilih kategori"),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(
    z.object({
      size: z.string().min(1, "Ukuran tidak boleh kosong"),
      stock: z.number().min(0, "Stok minimal 0"),
    })
  ).min(1, "Minimal 1 varian ukuran"),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Coupon form validation
export const couponSchema = z.object({
  code: z.string().min(3, "Kode kupon minimal 3 karakter").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(1, "Nilai diskon minimal 1"),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().optional().nullable(),
  usageLimit: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export type CouponFormData = z.infer<typeof couponSchema>;

// Login form validation
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Newsletter subscription
export const newsletterSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

// Order status check
export const orderStatusSchema = z.object({
  email: z.string().email("Email tidak valid"),
  orderNumber: z.string().min(1, "Masukkan nomor order"),
});

export type OrderStatusFormData = z.infer<typeof orderStatusSchema>;

// Category form
export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
