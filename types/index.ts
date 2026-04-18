export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  salePrice?: number | null;
  size: string;
  quantity: number;
  image: string;
  slug: string;
  stock: number;
  ppnRate: number;
  pph23Rate: number;
  discountRate: number;
}

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  categoryId: string;
  featured: boolean;
  isNew: boolean;
  isActive: boolean;
  ppnRate: number;
  pph23Rate: number;
  discountRate: number;
  showTaxDetails: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  variants: Array<{ id: string; size: string; stock: number }>;
  flashSale?: {
    id: string;
    salePrice: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  } | null;
}

export interface OrderWithRelations {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subtotal: number;
  taxPpn: number;
  taxPph23: number;
  totalDiscount: number;
  discount: number;
  uniqueCode: number;
  totalWithCode: number;
  total: number;
  status: string;
  notes: string | null;
  couponId: string | null;
  country: string;
  paymentMethod: string;
  shippingCost: number;
  trackingNumber: string | null;
  courier: string | null;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    size: string;
    ppnAmount: number;
    pph23Amount: number;
    discountAmount: number;
    product: {
      name: string;
      slug: string;
      images: Array<{ url: string }>;
    };
  }>;
  payment: {
    id: string;
    externalId: string;
    invoiceUrl: string;
    amount: number;
    currency: string;
    currencyAmount: number | null;
    status: string;
    method: string | null;
    paidAt: Date | null;
  } | null;
  coupon: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

export interface DashboardStats {
  totalRevenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  unpaidOrders: number;
  paidOrders: number;
  totalCustomers: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  ordersByMonth: Array<{ month: string; orders: number }>;
}

export interface CustomerWithStats {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  totalSpending: number;
  totalOrders: number;
}

export interface ProductFilters {
  category?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "latest" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
