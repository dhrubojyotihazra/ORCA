import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.FASTAPI_BASE_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
}

async function proxyUser(req: NextRequest, { params }: { params: Promise<{ action: string[] }> }) {
  const resolvedParams = await params;
  const actionPath = resolvedParams.action.join("/");
  const backendBase = getBackendBase();
  const url = `${backendBase}/api/v1/user/${actionPath}`;

  const headers: Record<string, string> = {};
  const authHeader = req.headers.get("authorization");
  if (authHeader) headers["authorization"] = authHeader;
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  let body: string | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {}
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await backendRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { text: responseText };
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    console.warn(`User proxy to ${url} failed, using local fallback:`, err.message);
    return NextResponse.json({
      id: "00000000-0000-0000-0000-000000000001",
      display_name: "Captain Fisher",
      language: "en",
      location_name: "Veraval Port",
      vessel_type: "medium",
    });
  }
}

export const GET = proxyUser;
export const POST = proxyUser;
export const PUT = proxyUser;