import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("file") as Blob | null;

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const GROQ_VOICE_KEYS = [
      process.env.GROQ_API_KEY_VOICE,
      process.env.GROQ_API_KEY_REASONING,
      process.env.GROQ_API_KEY_BACKUP,
      process.env.GROQ_API_KEY,
    ].filter((k): k is string => Boolean(k) && typeof k === "string" && k.trim().length > 0);

    let transcriptionText = "";
    let lastError = "";

    for (const key of GROQ_VOICE_KEYS) {
      try {
        const groqFormData = new FormData();
        groqFormData.append("file", audioBlob, "speech.webm");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("response_format", "json");

        const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
          },
          body: groqFormData,
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          transcriptionText = data.text;
          break;
        } else {
          lastError = await groqResponse.text();
          console.warn(`Whisper transcription with key failed (${groqResponse.status}):`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!transcriptionText && lastError) {
      throw new Error(`All Whisper keys failed: ${lastError}`);
    }

    return NextResponse.json({
      text: transcriptionText,
      model: "whisper-large-v3-turbo",
      status: "success",
    });
  } catch (error: any) {
    console.error("Groq Whisper Transcription Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
