/**
 * Shipping Service — no external API, fully admin-managed flat rate.
 * Lion Parcel tracking via direct link (free, unlimited).
 */

export interface ShippingRate {
  price: number;   // IDR
  etd: string;     // estimated delivery
}

export interface TrackingResult {
  waybillId: string;
  trackingUrl: string; // direct Lion Parcel link
}

/**
 * Get flat shipping rate from DB settings.
 * A single rate applies to ALL international orders.
 */
export async function getShippingRate(_countryCode: string): Promise<ShippingRate> {
  // Caller is responsible for passing the flat rate value from DB
  // This function is kept for interface consistency
  return {
    price: 0,
    etd: "3–14 days",
  };
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
