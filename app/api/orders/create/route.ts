import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { checkoutSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, couponCode, shippingCost } = body;

    // Validate customer data
    const validation = checkoutSchema.safeParse(customer);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validasi struktur items — cegah quantity negatif, ID palsu, atau array terlalu besar
    if (items.length > 50) {
      return NextResponse.json(
        { success: false, error: "Too many items in cart" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        typeof item.productId !== "string" ||
        typeof item.variantId !== "string" ||
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid cart item data" },
          { status: 400 }
        );
      }
    }

    // Build full address string from structured fields
    const { streetAddress, apartment, city, stateProvince, zipCode } = validation.data;
    const addressParts = [
      streetAddress,
      apartment || "",
      city,
      stateProvince,
      zipCode,
      validation.data.country,
    ].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const result = await paymentService.createOrder({
      customer: {
        name: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone,
        address: fullAddress,
      },
      items,
      couponCode,
      country: validation.data.country || "ID",
      orderNote: validation.data.orderNote,
      shippingCost: typeof shippingCost === "number" ? shippingCost : 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        invoiceUrl: result.invoiceUrl,
        invoiceNumber: result.invoiceNumber,
        paymentMethod: result.paymentMethod,
      },
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    // Surface meaningful stock/coupon errors as 400 instead of generic 500
    const isUserError = error instanceof Error && (
      error.message.includes("Stok tidak mencukupi") ||
      error.message.includes("Kupon")
    );
    return NextResponse.json(
      { success: false, error: isUserError ? error.message : "Failed to create order" },
      { status: isUserError ? 400 : 500 }
    );
  }
}
