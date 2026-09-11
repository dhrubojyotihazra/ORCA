import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Bhasini ULCA Configuration (MeitY Government of India)
const BHASINI_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";
const BHASINI_INFERENCE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const BHASINI_PIPELINE_ID = "64392f96daac500b55c543cd";
const BHASINI_TIMEOUT_MS = 3500;

// Pre-verified bootstrap map for fast zero-latency start across 5 target Indian languages
const DEFAULT_BHASINI_SERVICE_MAP: Record<string, string> = {
  en: "ai4bharat/whisper-medium-en--gpu--t4",
  hi: "ai4bharat/conformer-hi-gpu--t4",
  bn: "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",
  ta: "ai4bharat/conformer-multilingual-dravidian-gpu--t4",
  mr: "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",
};

const cachedServiceMap: Record<string, string> = { ...DEFAULT_BHASINI_SERVICE_MAP };
let lastConfigFetchTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getBhasiniServiceId(langCode: string, udyatKey: string, inferenceKey: string): Promise<string> {
  const now = Date.now();
  if (now - lastConfigFetchTime > CACHE_TTL_MS) {
    try {
      const resp = await fetch(BHASINI_CONFIG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ulcaApiKey: udyatKey,
          Authorization: inferenceKey,
        },
        body: JSON.stringify({
          pipelineTasks: [{ taskType: "asr" }],
          pipelineRequestConfig: { pipelineId: BHASINI_PIPELINE_ID },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (resp.ok) {
        const data = await resp.json();
        const configs = data?.pipelineResponseConfig?.[0]?.config || [];
        for (const item of configs) {
          const lang = item?.language?.sourceLanguage;
          const serviceId = item?.serviceId;
          if (lang && serviceId) {
            cachedServiceMap[lang] = serviceId;
          }
        }
        lastConfigFetchTime = now;
      }
    } catch (cfgErr) {
      console.warn("[ASR] Failed to refresh Bhasini pipeline config, using cached map:", cfgErr);
    }
  }

  return cachedServiceMap[langCode] || DEFAULT_BHASINI_SERVICE_MAP[langCode] || DEFAULT_BHASINI_SERVICE_MAP["en"];
}

function normalizeLanguage(lang: string | null): string {
  if (!lang) return "en";
  const cleaned = lang.trim().toLowerCase();
  if (cleaned.startsWith("hi")) return "hi";
  if (cleaned.startsWith("bn")) return "bn";
  if (cleaned.startsWith("ta")) return "ta";
  if (cleaned.startsWith("mr")) return "mr";
  if (cleaned.startsWith("en")) return "en";
  return "en";
}

function detectAudioFormat(blobType: string, filename?: string): string {
  const t = (blobType || "").toLowerCase();
  const f = (filename || "").toLowerCase();
  if (t.includes("wav") || f.endsWith(".wav")) return "wav";
  if (t.includes("mp3") || t.includes("mpeg") || f.endsWith(".mp3")) return "mp3";
  if (t.includes("ogg") || f.endsWith(".ogg")) return "ogg";
  if (t.includes("flac") || f.endsWith(".flac")) return "flac";
  return "webm";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("file") as Blob | null;
    const requestedLang = (formData.get("language") as string | null) || "en";
    const langCode = normalizeLanguage(requestedLang);

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const udyatKey = process.env.BHASINI_UDYAT_KEY?.trim();
    const inferenceKey = process.env.BHASINI_INFERENCE_KEY?.trim();

    // ─────────────────────────────────────────────────────────
    // PRIMARY PATH: Bhasini ULCA ASR (MeitY Government of India)
    // ─────────────────────────────────────────────────────────
    if (udyatKey && inferenceKey) {
      const bhasiniStartTime = Date.now();
      try {
        const serviceId = await getBhasiniServiceId(langCode, udyatKey, inferenceKey);
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const audioFormat = detectAudioFormat(audioBlob.type);

        const bhasiniRes = await fetch(BHASINI_INFERENCE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: inferenceKey,
          },
          body: JSON.stringify({
            pipelineTasks: [
              {
                taskType: "asr",
                config: {
                  language: { sourceLanguage: langCode },
                  serviceId: serviceId,
                  audioFormat: audioFormat,
                },
              },
            ],
            inputData: {
              audio: [{ audioContent: base64Audio }],
            },
          }),
          signal: AbortSignal.timeout(BHASINI_TIMEOUT_MS),
        });

        if (bhasiniRes.ok) {
          const resData = await bhasiniRes.json();
          const transcript = resData?.pipelineResponse?.[0]?.output?.[0]?.source;
          if (transcript && typeof transcript === "string" && transcript.trim().length > 0) {
            const elapsed = Date.now() - bhasiniStartTime;
            console.log(`[ASR-PROVENANCE] Served by Bhasini (${serviceId}, lang: ${langCode}) in ${elapsed}ms`);
            return NextResponse.json({
              text: transcript.trim(),
              model: serviceId,
              provider: "bhasini",
              status: "success",
              latencyMs: elapsed,
              language: langCode,
            });
          }
        }
        const errText = await bhasiniRes.text().catch(() => "");
        console.warn(`[ASR-PROVENANCE] Bhasini HTTP ${bhasiniRes.status} (${errText.slice(0, 100)}), falling back to Groq Whisper`);
      } catch (bhasiniErr: any) {
        const elapsed = Date.now() - bhasiniStartTime;
        console.warn(`[ASR-PROVENANCE] Bhasini failed after ${elapsed}ms (${bhasiniErr?.message || bhasiniErr}), falling back to Groq Whisper`);
      }
    } else {
      console.warn("[ASR-PROVENANCE] Bhasini credentials not configured, routing directly to Groq Whisper");
    }

    // ─────────────────────────────────────────────────────────
    // FALLBACK PATH: Groq Whisper Multi-Key Pipeline
    // ─────────────────────────────────────────────────────────
    const groqStartTime = Date.now();
    const GROQ_VOICE_KEYS = [
      process.env.GROQ_API_KEY_VOICE,
      process.env.GROQ_API_KEY_REASONING,
      process.env.GROQ_API_KEY_BACKUP,
      process.env.GROQ_API_KEY,
    ].filter((k): k is string => Boolean(k) && typeof k === "string" && k.trim().length > 0);

    let transcriptionText = "";
    let lastError = "";

    for (let i = 0; i < GROQ_VOICE_KEYS.length; i++) {
      const key = GROQ_VOICE_KEYS[i];
      try {
        const groqFormData = new FormData();
        groqFormData.append("file", audioBlob, "speech.webm");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("response_format", "json");
        if (langCode) {
          groqFormData.append("language", langCode);
        }

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
          const elapsed = Date.now() - groqStartTime;
          console.log(`[ASR-PROVENANCE] Served by Groq Whisper (key #${i + 1}) in ${elapsed}ms`);
          break;
        } else {
          lastError = await groqResponse.text().catch(() => "");
          console.warn(`Whisper transcription with key #${i + 1} failed (${groqResponse.status}):`, lastError);
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
      provider: "groq",
      status: "success",
      latencyMs: Date.now() - groqStartTime,
      language: langCode,
    });
  } catch (error: any) {
    console.error("ASR Transcription Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}

