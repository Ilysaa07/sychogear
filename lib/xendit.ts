import { Invoice } from "xendit-node";

if (!process.env.XENDIT_SECRET_KEY) {
  console.warn("[Xendit] XENDIT_SECRET_KEY is not set. Payment features will not work.");
}

// xendit-node v7+ style: instantiate per-service dengan secretKey
export const xenditInvoice = new Invoice({
  secretKey: process.env.XENDIT_SECRET_KEY || "",
});
