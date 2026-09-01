import { createVirtualAccount, createCheckoutSession } from "@/lib/doku";

export interface PaymentProvider {
  createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    expiredAt?: Date;
    description?: string;
    currency?: string;
    paymentMethod?: string;
    lineItems?: { name: string; price: number; quantity: number }[];
  }): Promise<{
    externalId: string;
    paymentGatewayId: string;
    invoiceUrl?: string;
    paymentCode?: string;
    status: string;
    paymentMethod: string;
  }>;
  verifyPayment(externalId: string): Promise<any>;
  cancelPayment(externalId: string): Promise<any>;
}

// ─── Manual Transfer Provider (fallback/legacy) ──────────────────────────────

export class ManualTransferProvider implements PaymentProvider {
  async createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
  }) {
    return {
      externalId: data.invoiceNumber,
      paymentGatewayId: "",
      invoiceUrl: `/order-success/${data.invoiceNumber}`,
      status: "UNPAID",
      paymentMethod: "MANUAL_TRANSFER",
    };
  }

  async verifyPayment(_externalId: string) {
    throw new Error("Manual transfer verification is done via admin dashboard.");
  }

  async cancelPayment(externalId: string) {
    return { success: true, externalId, status: "CANCELLED" };
  }
}

// ─── DOKU Provider (Non-SNAP Direct API) ─────────────────────────────────────

export class DokuProvider implements PaymentProvider {
  async createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    expiredAt?: Date;
    description?: string;
    currency?: string;
    paymentMethod?: string;
    lineItems?: { id?: string; name: string; price: number; quantity: number }[];
  }) {
    // Calculate expired time in minutes from now
    let expiredMinutes = 60; // default 1 hour
    if (data.expiredAt) {
      const diffMs = data.expiredAt.getTime() - Date.now();
      expiredMinutes = Math.max(15, Math.floor(diffMs / 60000));
    }

    try {
      const isDev = process.env.NODE_ENV !== "production";
      const baseUrl = isDev ? "http://localhost:3000" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      const callbackUrl = `${baseUrl}/order-success/${data.invoiceNumber}`;
      
      const response = await createCheckoutSession({
        invoiceNumber: data.invoiceNumber,
        amount: Math.round(data.amount),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        callbackUrl,
        expiredMinutes,
        lineItems: data.lineItems,
      });

      return {
        externalId: data.invoiceNumber,
        paymentGatewayId: response.response?.order?.invoice_number || data.invoiceNumber,
        invoiceUrl: response.response?.payment?.url,
        status: "PENDING",
        paymentMethod: "DOKU_CHECKOUT",
      };
    } catch (error: any) {
      const errMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      console.error("[DOKU] Create Payment Error:", errMsg);
      throw new Error("Failed to create DOKU Payment: " + errMsg);
    }
  }

  async verifyPayment(_externalId: string) {
    // Verified via DOKU Webhooks / Notification
    return null;
  }

  async cancelPayment(_externalId: string) {
    return { success: true, externalId: _externalId, status: "CANCELLED" };
  }
}

// ─── Active provider ─────────────────────────────────────────────────────────
export function getPaymentProvider(): PaymentProvider {
  const useDoku =
    process.env.DOKU_CLIENT_ID &&
    process.env.DOKU_SECRET_KEY &&
    process.env.PAYMENT_PROVIDER !== "manual";

  return useDoku ? new DokuProvider() : new ManualTransferProvider();
}
