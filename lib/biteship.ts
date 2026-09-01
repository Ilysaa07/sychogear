import { ShippingArea, ShippingRate } from "./shipping";

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || "";
const BITESHIP_BASE_URL = "https://api.biteship.com/v1";

const getHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${BITESHIP_API_KEY}`
});

export async function searchBiteshipDestination(search: string): Promise<ShippingArea[]> {
  try {
    if (!BITESHIP_API_KEY) {
      console.error("BITESHIP_API_KEY is not configured.");
      return [];
    }

    const res = await fetch(`${BITESHIP_BASE_URL}/maps/areas?countries=ID&input=${encodeURIComponent(search)}`, {
      headers: getHeaders()
    });
    
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Biteship API Error: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    if (!json.success) {
      console.error("Biteship API returned error:", json.error);
      return [];
    }

    const data = json.areas || [];
    
    // Deduplicate by Biteship area ID to prevent React duplicate key errors
    const uniqueMap = new Map();
    for (const item of data) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    const uniqueData = Array.from(uniqueMap.values());
    
    return uniqueData.map((item: any) => ({
      id: item.id,
      name: item.name,
      city_name: item.administrative_division_level_2_name,
      province_name: item.administrative_division_level_1_name,
      type: item.administrative_division_level_2_type || "", // e.g., "Kota" or "Kabupaten"
      postal_code: item.postal_code,
      label: `${item.name}, ${item.administrative_division_level_2_type || ''} ${item.administrative_division_level_2_name}, ${item.administrative_division_level_1_name}`
    }));
  } catch (error) {
    console.error("Failed to fetch Biteship destinations:", error);
    return [];
  }
}

export async function getBiteshipRates(originId: string, destinationId: string, weightGrams: number): Promise<ShippingRate[]> {
  try {
    if (!BITESHIP_API_KEY) {
      console.error("BITESHIP_API_KEY is not configured.");
      return [];
    }

    const payload = {
      origin_area_id: originId,
      destination_area_id: destinationId,
      couriers: "jne,sicepat,jnt,lion,pos,dhl,fedex,ray",
      items: [
        {
          name: "Package",
          description: "Clothing / Apparel",
          value: 100000,
          length: 10,
          width: 10,
          height: 10,
          weight: weightGrams,
          quantity: 1
        }
      ]
    };

    const res = await fetch(`${BITESHIP_BASE_URL}/rates/couriers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Biteship 400 Payload:", JSON.stringify(payload));
      console.error("Biteship 400 Response:", errorText);
      throw new Error(`Biteship API Error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const json = await res.json();
    if (!json.success) {
      console.error("Biteship API returned error:", json.error);
      return [];
    }

    const pricing = json.pricing || [];
    let rates: ShippingRate[] = [];

    for (const service of pricing) {
      rates.push({
        courier_name: service.courier_name,
        courier_code: service.courier_code,
        service_name: service.courier_service_name,
        service_code: service.courier_service_code,
        description: service.description,
        price: service.price,
        estimated_delivery_time: service.duration ? service.duration.replace("days", "Hari") : ""
      });
    }

    // Sort rates by cheapest first
    rates.sort((a, b) => a.price - b.price);

    return rates;
  } catch (error) {
    console.error("Failed to fetch Biteship rates:", error);
    return [];
  }
}
