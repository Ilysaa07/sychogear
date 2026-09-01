import crypto from "crypto";
import axios from "axios";

const isProduction = process.env.NODE_ENV === "production" || process.env.DOKU_ENV === "production";
const BASE_URL = isProduction
  ? "https://api.doku.com"
  : "https://api-sandbox.doku.com";

function generateDigest(body: string): string {
  return crypto.createHash("sha256").update(body).digest("base64");
}

function generateSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  target: string,
  digest: string,
  secretKey: string
): string {
  const component =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${target}\n` +
    `Digest:${digest}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(component)
    .digest("base64");

  return `HMACSHA256=${signature}`;
}

function generateRequestId(): string {
  return crypto.randomUUID();
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function sanitizeDokuString(str: string): string {
  if (!str) return "";
  // DOKU allowed characters: a-z A-Z 0-9 . - / + , = _ : ' @ % ( ) and space
  return str.replace(/[^a-zA-Z0-9.\-\/+,\=_:'@%() ]/g, " ").trim();
}

export interface DokuCreateVAResponse {
  order: {
    invoice_number: string;
    amount: number;
  };
  virtual_account_info: {
    virtual_account_number: string;
    how_to_pay_page: string;
    how_to_pay_api: string;
    expired_time?: number;
  };
  [key: string]: any;
}

export async function createVirtualAccount(params: {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  expiredMinutes?: number;
}): Promise<DokuCreateVAResponse> {
  const clientId = process.env.DOKU_CLIENT_ID || "";
  const secretKey = process.env.DOKU_SECRET_KEY || "";

  if (!clientId || !secretKey) {
    throw new Error("[DOKU] Missing DOKU_CLIENT_ID or DOKU_SECRET_KEY");
  }

  const requestTarget = "/doku-virtual-account/v2/payment-code";
  const requestId = generateRequestId();
  const timestamp = getTimestamp();

  const requestBody = {
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount,
      currency: "IDR",
    },
    virtual_account_info: {
      expired_time: params.expiredMinutes || 60,
      reusable_status: false,
      info1: `Payment for ${params.invoiceNumber}`,
    },
    customer: {
      name: sanitizeDokuString(params.customerName).substring(0, 50),
      email: params.customerEmail,
    },
  };

  const bodyString = JSON.stringify(requestBody);
  const digest = generateDigest(bodyString);
  const signature = generateSignature(
    clientId,
    requestId,
    timestamp,
    requestTarget,
    digest,
    secretKey
  );

  const response = await axios.post(
    `${BASE_URL}${requestTarget}`,
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: signature,
      },
      timeout: 15000,
    }
  );

  return response.data;
}

export interface DokuCheckoutResponse {
  message: string[];
  response: {
    order: {
      invoice_number: string;
      amount: number;
    };
    payment: {
      url: string;
      expired_date: string;
    };
  };
}

export interface DokuLineItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export async function createCheckoutSession(params: {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  callbackUrl: string;
  expiredMinutes?: number;
  lineItems?: DokuLineItem[];
}): Promise<DokuCheckoutResponse> {
  const clientId = process.env.DOKU_CLIENT_ID || "";
  const secretKey = process.env.DOKU_SECRET_KEY || "";

  if (!clientId || !secretKey) {
    throw new Error("[DOKU] Missing DOKU_CLIENT_ID or DOKU_SECRET_KEY");
  }

  const requestTarget = "/checkout/v1/payment";
  const requestId = generateRequestId();
  const timestamp = getTimestamp();

  const requestBody: any = {
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount,
      currency: "IDR",
      callback_url: params.callbackUrl,
    },
    payment: {
      payment_due_date: params.expiredMinutes || 60,
    },
    customer: {
      name: sanitizeDokuString(params.customerName).substring(0, 50),
      email: params.customerEmail,
    },
  };

  if (params.lineItems && params.lineItems.length > 0) {
    requestBody.order.line_items = params.lineItems.map(item => ({
      id: item.id ? sanitizeDokuString(item.id).substring(0, 50) : undefined,
      name: sanitizeDokuString(item.name).substring(0, 100), // DOKU name length limit
      price: Math.round(item.price),
      quantity: item.quantity
    }));
  }

  const bodyString = JSON.stringify(requestBody);
  const digest = generateDigest(bodyString);
  const signature = generateSignature(
    clientId,
    requestId,
    timestamp,
    requestTarget,
    digest,
    secretKey
  );

  const response = await axios.post(
    `${BASE_URL}${requestTarget}`,
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: signature,
      },
      timeout: 15000,
    }
  );

  return response.data;
}
