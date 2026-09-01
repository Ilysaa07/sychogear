import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersList = req.headers;
    
    // DOKU sends several headers for signature validation
    const signature = headersList.get("signature") || headersList.get("Signature") || "";
    const clientId = headersList.get("client-id") || headersList.get("Client-Id") || "";
    const requestId = headersList.get("request-id") || headersList.get("Request-Id") || "";
    const requestTimestamp = headersList.get("request-timestamp") || headersList.get("Request-Timestamp") || "";
    const requestTarget = "/api/webhooks/doku"; // The path configured in DOKU dashboard

    const secretKey = process.env.DOKU_SECRET_KEY || "";

    // Basic HMAC Signature validation (simplified, ideally follow full DOKU spec)
    // Digest = Base64(SHA256(Minified JSON Body))
    const digest = crypto.createHash("sha256").update(rawBody, "utf8").digest("base64");
    
    const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
    
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureComponent, "utf8")
      .digest("base64");

    const hmacSignature = `HMACSHA256=${expectedSignature}`;

    if (signature && hmacSignature !== signature) {
      console.warn("[DOKU Webhook] Invalid signature. Expected:", hmacSignature, "Got:", signature);
      // Strict enforce signature
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const invoiceNumber = payload.order?.invoice_number;
    const transactionStatus = payload.transaction?.status;

    if (!invoiceNumber) {
      return NextResponse.json({ error: "No invoice_number in payload" }, { status: 400 });
    }

    if (transactionStatus === "SUCCESS") {
      try {
        const result = await paymentService.confirmPayment(invoiceNumber);
        if (result.already_processed) {
          console.log(`[DOKU Webhook] Order ${invoiceNumber} is already processed.`);
        } else {
          console.log(`[DOKU Webhook] Successfully confirmed payment for ${invoiceNumber}`);
        }
      } catch (err: any) {
        console.error(`[DOKU Webhook] Failed to confirm payment for ${invoiceNumber}:`, err);
      }
    } else if (transactionStatus === "FAILED" || transactionStatus === "EXPIRED") {
      try {
         const result = await paymentService.expireOrder(invoiceNumber);
         if (result.already_processed) {
           console.log(`[DOKU Webhook] Order ${invoiceNumber} is already expired/processed.`);
         } else {
           console.log(`[DOKU Webhook] Expired payment for ${invoiceNumber}`);
         }
      } catch (err: any) {
         console.error(`[DOKU Webhook] Failed to expire payment for ${invoiceNumber}:`, err);
      }
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("[DOKU Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
