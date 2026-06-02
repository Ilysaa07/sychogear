import { xenditInvoice } from "@/lib/xendit";

export interface PaymentProvider {
  createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    expiredAt?: Date;
    description?: string;
    currency?: string;
  }): Promise<{
    externalId: string;
    xenditId: string;
    invoiceUrl: string;
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
      xenditId: "",
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

// ─── Xendit Invoice Provider ─────────────────────────────────────────────────

export class XenditProvider implements PaymentProvider {
  async createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    expiredAt?: Date;
    description?: string;
    currency?: string;
  }) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.vercel.app";

    const invoice = await xenditInvoice.createInvoice({
      data: {
        externalId: data.invoiceNumber,
        amount: data.amount,
        payerEmail: data.customerEmail,
        description: data.description || `Payment for order ${data.invoiceNumber}`,
        currency: (data.currency as "IDR" | "PHP" | "USD" | "THB" | "VND" | "MYR") || "IDR",
        // Redirect URLs — Xendit appends ?external_id=... and ?invoice_id=... automatically
        successRedirectUrl: `${appUrl}/payment/success`,
        failureRedirectUrl: `${appUrl}/payment/failed`,
        // Pass customer name through items description since Xendit v2 has no direct payer name field
        items: [
          {
            name: `Order ${data.invoiceNumber}`,
            quantity: 1,
            price: data.amount,
            category: "Apparel",
          },
        ],
        // Xendit Invoice expiry
        ...(data.expiredAt && {
          invoiceDuration: Math.max(
            60,
            Math.floor((data.expiredAt.getTime() - Date.now()) / 1000)
          ),
        }),
      },
    });

    return {
      externalId: data.invoiceNumber,
      xenditId: (invoice as any).id || (invoice as any).invoiceId || "",
      invoiceUrl: (invoice as any).invoiceUrl || (invoice as any).invoice_url || "",
      status: "PENDING",
      paymentMethod: "XENDIT",
    };
  }

  async verifyPayment(externalId: string) {
    // Xendit sends webhooks automatically — direct verification is rarely needed
    const invoices = await xenditInvoice.getInvoices({ externalId });
    return (invoices as any)?.[0] ?? null;
  }

  async cancelPayment(_externalId: string) {
    // Xendit invoices expire automatically; no explicit cancel API for invoices
    return { success: true, externalId: _externalId, status: "CANCELLED" };
  }
}

// ─── Active provider ─────────────────────────────────────────────────────────
// Switch by setting PAYMENT_PROVIDER env var:
//   PAYMENT_PROVIDER=xendit   → use Xendit (default when key is set)
//   PAYMENT_PROVIDER=manual   → use manual bank transfer
export function getPaymentProvider(): PaymentProvider {
  const useXendit =
    process.env.XENDIT_SECRET_KEY &&
    process.env.PAYMENT_PROVIDER !== "manual";

  return useXendit ? new XenditProvider() : new ManualTransferProvider();
}
