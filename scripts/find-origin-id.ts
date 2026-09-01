import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";

if (!RAJAONGKIR_API_KEY || RAJAONGKIR_API_KEY.includes("YOUR_")) {
  console.error("Error: RAJAONGKIR_API_KEY is missing or invalid in .env.local");
  process.exit(1);
}

async function searchOrigin(query: string) {
  console.log(`Searching for "parungserab"...`);
  
  try {
    const res = await fetch(`https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=parungserab&limit=1`, {
      headers: {
        "Content-Type": "application/json",
        "key": process.env.RAJAONGKIR_API_KEY || "1PCQhtm5fa08f19d8f062ebauCTLbfkq"
      }
    });

    const data = await res.json();
    console.log("Rajaongkir Komerce API Data:");
    console.log(JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    
    if (json.meta && json.meta.code !== 200) {
      throw new Error(json.meta.message);
    }

    const results = json.data || [];
    
    if (results.length === 0) {
      console.log("No results found.");
      return;
    }

    console.log("\n--- Search Results ---");
    results.forEach((item: any, index: number) => {
      const id = item.id || item.subdistrict_id;
      const name = item.name || item.subdistrict_name;
      console.log(`${index + 1}. ID: ${id}`);
      console.log(`   Location: ${name}, ${item.type} ${item.city_name}, ${item.province_name}`);
      console.log(`   Postal Code: ${item.zip_code}\n`);
    });
    
    console.log("Copy the correct 'ID' and paste it into RAJAONGKIR_ORIGIN_ID in your .env.local file.");
    
  } catch (error) {
    console.error("Search failed:", error);
  }
}

const query = process.argv[2];

if (!query) {
  console.error("Please provide a search keyword. Example: npx tsx scripts/find-origin-id.ts jakarta");
  process.exit(1);
}

searchOrigin(query);
