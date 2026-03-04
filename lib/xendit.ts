import crypto from "crypto";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;
const BASE_URL = "https://api.xendit.co";

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  customerName: string;
  customerPhone?: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  invoice_url: string;
  status: string;
  amount: number;
  expiry_date: string;
}

export async function createInvoice(
  params: CreateInvoiceParams
): Promise<XenditInvoiceResponse> {
  const response = await fetch(`${BASE_URL}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      currency: "IDR",
      customer: {
        given_names: params.customerName,
        email: params.payerEmail,
        mobile_number: params.customerPhone,
      },
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
      items: params.items,
      invoice_duration: 86400, // 24 hours
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Xendit API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export function verifyWebhookSignature(
  webhookToken: string
): boolean {
  return webhookToken === XENDIT_WEBHOOK_TOKEN;
}

export function generateCallbackToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
