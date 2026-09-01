import { prisma } from "@/lib/prisma";
import { searchBiteshipDestination, getBiteshipRates } from "./biteship";
import { searchDestination as searchRajaongkirDestination, getShippingCosts as getRajaongkirRates } from "./rajaongkir";

export type ShippingArea = {
  id: string;
  name: string;
  city_name: string;
  province_name: string;
  type: string;
  postal_code?: string;
  label?: string;
}

export type ShippingRate = {
  courier_name: string;
  courier_code: string;
  service_name: string;
  service_code: string;
  description: string;
  price: number;
  estimated_delivery_time: string;
}

export async function getActiveProvider(): Promise<string> {
  try {
    const setting = await (prisma as any).siteSettings.findUnique({
      where: { key: "shippingProvider" }
    });
    return setting?.value || "rajaongkir";
  } catch (error) {
    console.error("Failed to fetch shippingProvider from DB:", error);
    return "rajaongkir";
  }
}

export async function searchDestination(search: string): Promise<ShippingArea[]> {
  const provider = await getActiveProvider();
  
  if (provider === "biteship") {
    return searchBiteshipDestination(search);
  }
  
  return searchRajaongkirDestination(search);
}

export async function getShippingCosts(originId: string, destinationId: string, weightGrams: number): Promise<ShippingRate[]> {
  const provider = await getActiveProvider();
  
  if (provider === "biteship") {
    // Note: Biteship origin ID needs to be configured in .env.local as BITESHIP_ORIGIN_ID
    // Fallback to originId if not set, though it likely won't work since RajaOngkir IDs != Biteship IDs.
    const biteshipOriginId = process.env.BITESHIP_ORIGIN_ID || originId; 
    return getBiteshipRates(biteshipOriginId, destinationId, weightGrams);
  }
  
  return getRajaongkirRates(originId, destinationId, weightGrams);
}
