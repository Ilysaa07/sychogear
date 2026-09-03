import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1WQ8MBhl_x3PGitRKI53kSOd_BIcqDU1Y4c8N9aXpdeI/export?format=csv&gid=0";

function parseCurrency(value: string | undefined): number {
  if (!value) return 0;
  const clean = value.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date();
  // Format is DD/MM/YYYY
  const parts = value.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

function sanitizeWhatsapp(phone: string | undefined): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  // Standardize to 62... for database consistency
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, csvUrl } = body;
    
    if (!campaignId) {
      return NextResponse.json({ success: false, error: "campaignId is required" }, { status: 400 });
    }

    const targetUrl = csvUrl || SHEET_CSV_URL;
    
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    const parsed = Papa.parse(csvText, {
      skipEmptyLines: true,
    });
    
    if (parsed.errors.length > 0) {
      console.warn("CSV parsing errors:", parsed.errors);
    }
    
    const rows = parsed.data as string[][];
    
    // Find header row
    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === "NO" && rows[i][2] === "NAMA") {
        headerRowIdx = i;
        break;
      }
    }
    
    if (headerRowIdx === -1) {
      return NextResponse.json({ success: false, error: "Header row not found in spreadsheet" }, { status: 400 });
    }
    
    let imported = 0;
    
    const dataRows = rows.slice(headerRowIdx + 1);
    
    for (const row of dataRows) {
      // row[1] is NO, row[2] is NAMA
      const no = row[1]?.trim();
      const nama = row[2]?.trim();
      
      if (!no || !nama || isNaN(parseInt(no, 10))) {
        continue; // Skip empty rows or rows where NO is not a number
      }
      
      const tglOrder = row[3]?.trim();
      const noWa = row[4]?.trim();
      const alamat = row[5]?.trim();
      
      // Sizes S, M, L, XL, XXL (cols 6-10)
      const qtyS = parseInt(row[6] || "0", 10) || 0;
      const qtyM = parseInt(row[7] || "0", 10) || 0;
      const qtyL = parseInt(row[8] || "0", 10) || 0;
      const qtyXL = parseInt(row[9] || "0", 10) || 0;
      const qtyXXL = parseInt(row[10] || "0", 10) || 0;
      
      const catatan = row[12]?.trim();
      const bank = row[13]?.trim();
      const atasNama = row[14]?.trim();
      const noResi = row[15]?.trim();
      const statusRaw = row[16]?.trim().toUpperCase() || "";
      
      const buktiDp = row[17]?.trim();
      const buktiFull = row[18]?.trim();
      
      const totalBiaya = parseCurrency(row[19]);
      const sudahDibayar = parseCurrency(row[20]);
      
      let status: "PENDING" | "DP_PAID" | "FULL_PAID" | "CANCELLED" = "PENDING";
      if (statusRaw.includes("FULL PAYMENT") || (totalBiaya > 0 && sudahDibayar >= totalBiaya)) {
        status = "FULL_PAID";
      } else if (statusRaw.includes("DP") || sudahDibayar > 0) {
        status = "DP_PAID";
      }
      
      const preOrderNumber = `PO-${no.padStart(4, "0")}`;
      const sanitizedWa = sanitizeWhatsapp(noWa);
      
      // Upsert the PreOrder
      const po = await prisma.preOrder.upsert({
        where: { preOrderNumber },
        update: {
          customerName: nama,
          whatsapp: sanitizedWa,
          address: alamat,
          orderDate: parseDate(tglOrder),
          notes: catatan,
          bankName: bank,
          bankAccountName: atasNama,
          totalAmount: totalBiaya,
          dpAmount: sudahDibayar,
          isPaid: status === "FULL_PAID",
          status,
          receiptNumber: noResi,
          dpProofUrl: buktiDp,
          fullProofUrl: buktiFull
        },
        create: {
          preOrderNumber,
          customerName: nama,
          whatsapp: sanitizedWa,
          address: alamat,
          orderDate: parseDate(tglOrder),
          notes: catatan,
          bankName: bank,
      const existingPO = await prisma.preOrder.findUnique({
        where: { preOrderNumber }
      });

      if (existingPO) {
        await prisma.preOrderItem.deleteMany({
          where: { preOrderId: existingPO.id }
        });
        
        await prisma.preOrder.update({
          where: { id: existingPO.id },
          data: {
            customerName: nama,
            whatsapp: sanitizedWa,
            campaignId,
            address: alamat,
            orderDate: parseDate(tglOrder),
            notes: catatan,
            bankName: bank,
            bankAccountName: atasNama,
            totalAmount: totalBiaya,
            dpAmount: sudahDibayar,
            isPaid: status === "FULL_PAID",
            status,
            receiptNumber: noResi,
            dpProofUrl: buktiDp,
            fullProofUrl: buktiFull,
            items: { create: itemsToCreate }
          }
        });
      } else {
        await prisma.preOrder.create({
          data: {
            preOrderNumber,
            customerName: nama,
            whatsapp: sanitizedWa,
            campaignId,
            address: alamat,
            orderDate: parseDate(tglOrder),
            notes: catatan,
            bankName: bank,
            bankAccountName: atasNama,
            totalAmount: totalBiaya,
            dpAmount: sudahDibayar,
            isPaid: status === "FULL_PAID",
            status,
            receiptNumber: noResi,
            dpProofUrl: buktiDp,
            fullProofUrl: buktiFull,
            items: { create: itemsToCreate }
          }
        });
      }
      
      imported++;
    }
    
    return NextResponse.json({ success: true, imported });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
