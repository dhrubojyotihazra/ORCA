import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, language = "en-IN", voice } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Call FastAPI Neural TTS service
    const backendBase = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const fastApiResponse = await fetch(`${backendBase}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, voice }),
    });

    if (!fastApiResponse.ok) {
      const errText = await fastApiResponse.text();
      console.warn("FastAPI TTS returned non-200:", fastApiResponse.status, errText);
      return NextResponse.json({ error: errText }, { status: fastApiResponse.status });
    }

    const audioArrayBuffer = await fastApiResponse.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioArrayBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Next.js TTS Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate neural TTS" },
      { status: 500 }
    );
  }
}
