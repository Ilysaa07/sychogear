import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── UA Parser helpers ───────────────────────────────────────────────────────

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/MSIE|Trident/i.test(ua)) return "IE";
  return "Other";
}

function parseOS(ua: string): string {
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  return "Other";
}

function parseDevice(ua: string): string {
  if (/iPad/i.test(ua)) return "Tablet";
  if (/Mobile|Android|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua))
    return "Mobile";
  return "Desktop";
}

// ── Geolocation via ip-api.com ──────────────────────────────────────────────

async function geolocate(
  ip: string
): Promise<{ country: string; city: string }> {
  // Skip private / loopback IPs
  if (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return { country: "Localhost", city: "-" };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,city,status`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.status === "success") {
      return { country: data.country || "-", city: data.city || "-" };
    }
  } catch {
    // ignore
  }
  return { country: "-", city: "-" };
}

// ── POST /api/visitors ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, page, referrer } = body;

    if (!sessionId || !page) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Get real IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "");

    // User-Agent
    const ua = req.headers.get("user-agent") || "";

    // Parallel: geolocation + parse UA
    const [geo] = await Promise.all([geolocate(ip)]);

    await prisma.visitorLog.create({
      data: {
        sessionId,
        ip: ip || null,
        country: geo.country || null,
        city: geo.city || null,
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        os: parseOS(ua),
        page,
        referrer: referrer || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[visitors] POST error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// ── GET /api/visitors ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [logs, total, todayCount, uniqueSessionsRaw, topPagesRaw, topCountriesRaw] =
      await Promise.all([
        // Latest visitor log rows
        prisma.visitorLog.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        // Total in period
        prisma.visitorLog.count({ where: { createdAt: { gte: since } } }),
        // Today count
        prisma.visitorLog.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        // Unique sessions in period (raw groupBy)
        prisma.visitorLog.groupBy({
          by: ["sessionId"],
          where: { createdAt: { gte: since } },
          _count: true,
        }),
        // Top pages
        prisma.visitorLog.groupBy({
          by: ["page"],
          where: { createdAt: { gte: since } },
          _count: { page: true },
          orderBy: { _count: { page: "desc" } },
          take: 5,
        }),
        // Top countries
        prisma.visitorLog.groupBy({
          by: ["country"],
          where: { createdAt: { gte: since } },
          _count: { country: true },
          orderBy: { _count: { country: "desc" } },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        todayCount,
        uniqueSessions: uniqueSessionsRaw.length,
        topPages: topPagesRaw.map((p) => ({
          page: p.page,
          count: p._count.page,
        })),
        topCountries: topCountriesRaw.map((c) => ({
          country: c.country || "-",
          count: c._count.country,
        })),
      },
    });
  } catch (error) {
    console.error("[visitors] GET error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
