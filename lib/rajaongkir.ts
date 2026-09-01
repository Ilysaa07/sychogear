export interface RajaongkirSubdistrict {
  id: string;
  name: string;
  city_name: string;
  province_name: string;
  type: string; // e.g. "Kabupaten" or "Kota"
  postal_code?: string;
  label?: string; // Precomputed label for frontend
}

export interface RajaongkirRate {
  courier_name: string;
  courier_code: string;
  service_name: string;
  service_code: string;
  description: string;
  price: number;
  estimated_delivery_time: string;
}

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";

const getHeaders = () => ({
  "Content-Type": "application/json",
  "key": RAJAONGKIR_API_KEY || ""
});

/**
 * Searches for a subdistrict using the direct search method.
 */
export async function searchDestination(search: string): Promise<RajaongkirSubdistrict[]> {
  try {
    const res = await fetch(`${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=10&offset=0`, {
      headers: getHeaders()
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`Rajaongkir API Error: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (json.meta && json.meta.code !== 200) {
      console.error("Rajaongkir API returned error:", json.meta.message);
      return [];
    }

    // Adapt to common Rajaongkir format vs Komerce V1 format
    const data = json.data || [];
    
    return data.map((item: any) => ({
      id: item.id || item.subdistrict_id,
      name: item.subdistrict_name ? `${item.subdistrict_name}, ${item.district_name} District` : (item.name || item.subdistrict_name),
      city_name: item.city_name,
      province_name: item.province_name,
      type: item.type || "",
      postal_code: item.zip_code,
      label: item.label || `${item.name || item.subdistrict_name}, ${item.type || ''} ${item.city_name}, ${item.province_name}`
    }));
  } catch (error) {
    console.error("Failed to fetch Rajaongkir destinations:", error);
    return [];
  }
}

/**
 * Calculates shipping costs using Subdistrict IDs.
 */
export async function getShippingCosts(originId: string, destinationId: string, weightGrams: number): Promise<RajaongkirRate[]> {
  try {
    const couriers = ["jne", "jnt", "sicepat", "lion"];
    let rates: RajaongkirRate[] = [];

    // Komerce API only supports querying one courier at a time
    const fetchPromises = couriers.map(async (courier) => {
      const formData = new URLSearchParams();
      formData.append("origin", originId);
      formData.append("destination", destinationId);
      formData.append("weight", weightGrams.toString());
      formData.append("courier", courier);

      const res = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "key": RAJAONGKIR_API_KEY || ""
        },
        body: formData.toString()
      });

      if (!res.ok) return [];

      const json = await res.json();
      if (json.meta && json.meta.code !== 200) return [];
      
      return json.data || [];
    });

    const resultsArray = await Promise.all(fetchPromises);
    
    // Parse Komerce flattened format for all couriers
    resultsArray.forEach(results => {
      for (const service of results) {
        // Filter out extreme cargo services which confuse users
        if (service.service && (service.service.includes("<") || service.service.includes(">"))) {
          continue;
        }

        rates.push({
          courier_name: service.name || service.code,
          courier_code: service.code,
          service_name: service.service,
          service_code: service.service,
          description: service.description,
          price: service.cost,
          estimated_delivery_time: service.etd || ""
        });
      }
    });

    // Sort rates by cheapest first
    rates.sort((a, b) => a.price - b.price);

    return rates;
  } catch (error) {
    console.error("Failed to fetch Rajaongkir rates:", error);
    return [];
  }
}

/**
 * Generate a Lion Parcel tracking URL — free, no API balance needed.
 */
export function getLionParcelTrackingUrl(awb: string): string {
  return `https://lionparcel.com/cek-resi?awb=${encodeURIComponent(awb)}`;
}

export interface TrackingInfo {
  waybillId: string;
  trackingUrl: string;
}

export function buildTrackingResult(awb: string): TrackingInfo {
  return {
    waybillId: awb,
    trackingUrl: getLionParcelTrackingUrl(awb),
  };
}
