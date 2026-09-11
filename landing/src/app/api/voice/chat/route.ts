import { NextRequest, NextResponse } from "next/server";
import { getCoastalTelemetry, MarineStationTelemetry } from "@/lib/incois-service";

const GROQ_VOICE_KEYS = [
  process.env.GROQ_API_KEY_VOICE,
  process.env.GROQ_API_KEY_REASONING,
  process.env.GROQ_API_KEY_BACKUP,
  process.env.GROQ_API_KEY,
].filter((k): k is string => Boolean(k) && typeof k === "string" && k.trim().length > 0);

function cleanSpokenText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  // Strip thought tags
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Strip markdown, asterisks, brackets, hashes, latex
  text = text.replace(/\$\$[\s\S]*?\$\$/g, "");
  text = text.replace(/\\\(|\\\)/g, "");
  text = text.replace(/\$[^\$]*\$/g, "");
  text = text.replace(/[*#_~`>\[\]\(\)]/g, " ");
  // Strip emojis
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
  // Normalize spaces
  return text.replace(/\s+/g, " ").trim();
}

function generateSpokenAdvisory(
  query: string,
  t: MarineStationTelemetry,
  vesselType: string,
  userRole: string,
  lang: string
): string {
  const isSmall = vesselType === "small";
  const waveHeight = t.weather.significantWaveHeightM;
  const windSpeed = t.weather.windSpeedKnots;
  const riskCategory = t.risk.riskCategory;
  const port = t.station;
  const targetFish = "Hilsa and coastal pelagics";
  const pfzDist = t.ocean.pfzCoordinates[0]?.distanceNm || 14;
  const pfzBearing = t.ocean.pfzCoordinates[0]?.bearing || "Southeast";

  if (lang === "hi") {
    if (riskCategory === "Safe") {
      return `${port} के पास समुद्र शांत है। लहरें लगभग ${waveHeight} मीटर हैं और हवा ${windSpeed} समुद्री मील है। आज आपके लिए समुद्र में जाना सुरक्षित है।`;
    } else if (riskCategory === "Caution") {
      return `${port} के आसपास समुद्र मध्यम है। लहरें ${waveHeight} मीटर हैं और हवा ${windSpeed} समुद्री मील है। छोटी नावों को सावधानी बरतने और प्रस्थान में देरी करने की सलाह दी जाती है।`;
    } else {
      return `सावधान! ${port} के पास समुद्र आज बहुत अशांत है। लहरें ${waveHeight} मीटर और तेज हवाएं हैं। आज बंदरगाह में ही रहें।`;
    }
  }

  if (lang === "bn") {
    if (riskCategory === "Safe") {
      return `${port} উপকূলের কাছে সমুদ্র শান্ত রয়েছে। ঢেউ প্রায় ${waveHeight} মিটার। আজ সাগরে যাওয়া নিরাপদ।`;
    } else if (riskCategory === "Caution") {
      return `${port} এলাকায় সমুদ্র কিছুটা উত্তাল। ঢেউ ${waveHeight} মিটার এবং বাতাস ${windSpeed} নট। ছোট নৌকাগুলির জন্য সতর্কতা বজায় রাখা উচিত।`;
    } else {
      return `সতর্কতা! ${port} উপকূলের আবহাওয়া আজ বিপজ্জনক। ঢেউ ${waveHeight} মিটার। আজ সমুদ্রে না যাওয়ার পরামর্শ দেওয়া হচ্ছে।`;
    }
  }

  if (lang === "ta") {
    if (riskCategory === "Safe") {
      return `${port} கடலோரப் பகுதி அமைதியாக உள்ளது. அலைகள் ${waveHeight} மீட்டராக உள்ளன. இன்று கடலுக்குச் செல்வது பாதுகாப்பானது.`;
    } else {
      return `எச்சரிக்கை! ${port} பகுதியில் அலைகள் ${waveHeight} மீட்டராகவும் காற்று ${windSpeed} நாட்ஸாகவும் உள்ளது. சிறிய படகுகள் துறைமுகத்திலேயே இருக்குமாறு அறிவுறுத்தப்படுகிறது.`;
    }
  }

  if (lang === "mr") {
    if (riskCategory === "Safe") {
      return `${port} किनारपट्टीवर समुद्र शांत आहे. लाटांची उंची ${waveHeight} मीटर आहे. आज समुद्रात जाणे सुरक्षित आहे.`;
    } else {
      return `सावधान! ${port} जवळ लाटांची उंची ${waveHeight} मीटर असून वारा ${windSpeed} नॉट्स आहे. लहान बोटींनी बंदरातच थांबावे.`;
    }
  }

  // English default
  const q = query.toLowerCase();
  const asksFish = q.includes("fish") || q.includes("pfz") || q.includes("catch") || q.includes("zone");

  if (asksFish) {
    return `Conditions off ${port} show ${waveHeight} metre waves and ${windSpeed} knot winds. Safe fishing grounds for ${targetFish} are located approximately ${pfzDist} nautical miles ${pfzBearing}.`;
  }

  if (riskCategory === "Safe") {
    return `Sea conditions off ${port} are calm today. Wave height is ${waveHeight} metres with winds at ${windSpeed} knots, making it safe for your ${isSmall ? "small craft" : "vessel"} to operate.`;
  } else if (riskCategory === "Caution") {
    return `Caution is advised off ${port} today. Waves are moderate at ${waveHeight} metres with winds around ${windSpeed} knots. ${isSmall ? "Small craft should consider delaying sea departure." : "Exercise watchful navigation."}`;
  } else {
    return `Hazardous sea conditions detected off ${port}. Wave heights reach ${waveHeight} metres with strong squall risks. All craft are strongly advised to remain in port.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message = "",
      location = { lat: 20.26, lon: 86.67, name: "Paradip Harbour", sector: "Zone 4 (Odisha)" },
      vesselType = "small",
      userRole = "fisher",
      language = "en-IN",
    } = body;

    const locLat = location.lat || 20.26;
    const locLon = location.lon || 86.67;
    const locName = location.name || "Paradip Harbour";
    const langCode = (language || "en").slice(0, 2);

    // 1. Fetch real-time marine telemetry instantly (~10ms)
    const telemetry = await getCoastalTelemetry(locLat, locLon, locName, vesselType as any);

    // 2. Attempt fast LLM generation via Groq
    let spokenResponse = "";

    if (GROQ_VOICE_KEYS.length > 0) {
      const systemInstruction = `You are ORCA Voice, a direct maritime voice assistant speaking out loud to a ${userRole.replace("_", " ")} at ${locName}.
Telemetry: Wave height: ${telemetry.weather.significantWaveHeightM}m (${telemetry.weather.significantWaveHeightM < 1.5 ? "Calm" : "Moderate"}), Wind: ${telemetry.weather.windSpeedKnots} kts (${telemetry.weather.windDirectionText}), Squall probability: ${telemetry.weather.squallProbabilityPct}%, Safety Index: ${telemetry.risk.safetyIndex}/100 (${telemetry.risk.riskCategory}).
Target fish zone: ${telemetry.ocean.pfzCoordinates[0]?.distanceNm || 14} NM ${telemetry.ocean.pfzCoordinates[0]?.bearing || "Southeast"}.

MANDATORY RULES:
1. Speak in exactly 2 concise, natural sentences suitable for text-to-speech audio.
2. NO markdown, NO asterisks, NO bullet points, NO brackets, NO emojis.
3. State the practical safety status first, then essential wave, wind, or fishing detail.
4. If language is '${langCode}', respond in that language.`;

      for (const key of GROQ_VOICE_KEYS) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [
                {"role": "system", "content": systemInstruction},
                {"role": "user", "content": message || "Is it safe to operate today?"}
              ],
              max_tokens: 100,
              temperature: 0.2,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rawContent = data.choices?.[0]?.message?.content || "";
            const cleaned = cleanSpokenText(rawContent);
            if (cleaned.length > 20) {
              spokenResponse = cleaned;
              break;
            }
          }
        } catch {
          // try next key
        }
      }
    }

    // 3. Guaranteed instant fallback grounded in verified INCOIS telemetry
    if (!spokenResponse) {
      spokenResponse = generateSpokenAdvisory(message, telemetry, vesselType, userRole, langCode);
    }

    return NextResponse.json({
      text: spokenResponse,
      telemetry: {
        station: telemetry.station,
        waveHeightM: telemetry.weather.significantWaveHeightM,
        windKnots: telemetry.weather.windSpeedKnots,
        riskCategory: telemetry.risk.riskCategory,
        safetyIndex: telemetry.risk.safetyIndex,
      },
      status: "success",
    });
  } catch (error: any) {
    console.error("Voice Chat API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate voice advisory" },
      { status: 500 }
    );
  }
}
