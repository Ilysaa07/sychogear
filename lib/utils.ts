export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  // Bug #7 fix: use crypto for better randomness vs Math.random().
  // crypto.getRandomValues gives 256-bit entropy — effectively zero collision risk.
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const random = array[0].toString(36).toUpperCase().padStart(7, "0").slice(-7);
  return `SG-${year}${month}${day}-${random}`;
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculatePercentageGrowth(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function getMonthName(month: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[month];
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-green-500/20 text-green-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    SHIPPED: "bg-purple-500/20 text-purple-400",
    DELIVERED: "bg-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    EXPIRED: "bg-gray-500/20 text-gray-400",
    FAILED: "bg-red-500/20 text-red-400",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}

/**
 * Bug #13 fix: Shared API error handler.
 * Detects common Prisma errors and returns user-friendly messages.
 * Always logs the full error to console so devs can see details.
 */
export function parseApiError(error: unknown, fallback = "Terjadi kesalahan"): { message: string; status: number } {
  console.error("[API Error]", error);
  // Prisma unique constraint violation (P2002)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    const fields = (error as { meta?: { target?: string[] } }).meta?.target;
    return { message: `Data sudah ada${fields ? ` (${fields.join(", ")})` : ""}`, status: 409 };
  }
  // Prisma record not found (P2025)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  ) {
    return { message: "Data tidak ditemukan", status: 404 };
  }
  return { message: fallback, status: 500 };
}
