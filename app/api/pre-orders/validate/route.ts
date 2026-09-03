import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken } from "@/lib/turnstile";

function sanitizeWhatsapp(phone: string | undefined | null): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return clean;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const whatsapp = searchParams.get("whatsapp");
    const turnstileToken = searchParams.get("turnstileToken");

    const turnstileCheck = await verifyTurnstileToken(turnstileToken);
    if (!turnstileCheck.success) {
      return NextResponse.json({ error: turnstileCheck.error }, { status: 403 });
    }
    
    if (!whatsapp) {
      return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
    }
    
    const sanitizedWa = sanitizeWhatsapp(whatsapp);
    
    // Find the latest pre-order associated with this WA
    const preOrders = await prisma.preOrder.findMany({
      where: { whatsapp: sanitizedWa },
      include: { 
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }, 
        campaign: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (preOrders.length === 0) {
      return NextResponse.json({ error: "Pre-order not found for this number" }, { status: 404 });
    }
    
    // We return the array of pre-orders so the frontend can display them (or just pick the first one)
    return NextResponse.json(preOrders);
  } catch (error: any) {
    console.error("GET Validate PreOrders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
