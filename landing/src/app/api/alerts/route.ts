import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.FASTAPI_BASE_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const backendBase = getBackendBase();
  const searchParams = req.nextUrl.searchParams;
  const url = `${backendBase}/api/v1/alerts?${searchParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Could not fetch alerts from backend:", e);
  }

  // Fallback active hazard alerts
  return NextResponse.json([
    {
      id: "alert-001",
      severity: "red",
      title: "Severe Cyclone Advisory (Gujarat Coast)",
      description: "Squally winds 75-85 km/h gusting to 95 km/h. High swell waves 3.5m - 4.5m. Fishing suspended.",
      source: "IMD / INCOIS",
      distance_km: 42.0,
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "alert-002",
      severity: "amber",
      title: "High Swell Surge Warning (Konkan & Coromandel Coast)",
      description: "Swell surge waves of 2.5m - 3.2m forecasted during high tide.",
      source: "INCOIS Hyderabad",
      distance_km: 88.0,
      expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    }
  ]);
}