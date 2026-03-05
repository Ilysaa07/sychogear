import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { checkoutSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, couponCode } = body;

    // Validate customer data
    const validation = checkoutSchema.safeParse(customer);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Keranjang kosong" },
        { status: 400 }
      );
    }

    const result = await paymentService.createOrder({
      customer: {
        name: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone,
        address: validation.data.address,
      },
      items,
      couponCode,
    });

    return NextResponse.json({
      success: true,
      data: {
        invoiceUrl: result.invoiceUrl,
        invoiceNumber: result.invoiceNumber,
      },
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    // Bug #6 fix: surface meaningful stock/coupon errors as 400 instead of generic 500
    const isUserError = error instanceof Error && (
      error.message.includes("Stok tidak mencukupi") ||
      error.message.includes("Kupon")
    );
    return NextResponse.json(
      { success: false, error: isUserError ? error.message : "Gagal membuat invoice" },
      { status: isUserError ? 400 : 500 }
    );
  }
}
