export type AiProvider = "kenari" | "sumopod";

interface ProviderConfig {
  baseUrl: string;
  apiKey: string | undefined;
  modelLight: string;
  modelHeavy: string;
}

const PROVIDERS: Record<AiProvider, ProviderConfig> = {
  kenari: {
    baseUrl: process.env.KENARI_BASE_URL ?? "https://kenari.id/v1",
    apiKey: process.env.KENARI_API_KEY ?? process.env.AI_API_KEY,
    // Model ringan: dipakai buat chat/pertanyaan biasa (cepat & murah)
    modelLight: process.env.KENARI_MODEL ?? process.env.AI_MODEL ?? "gpt-oss-20b",
    // Model berat: dipakai buat pertanyaan yang butuh reasoning/hitungan mendalam
    modelHeavy: process.env.KENARI_MODEL_HEAVY ?? process.env.AI_MODEL_HEAVY ?? "gpt-oss-120b",
  },
  sumopod: {
    baseUrl: process.env.SUMOPOD_BASE_URL ?? "https://ai.sumopod.com/v1",
    apiKey: process.env.SUMOPOD_API_KEY,
    modelLight: process.env.SUMOPOD_MODEL ?? "gpt-5.6-luna",
    modelHeavy: process.env.SUMOPOD_MODEL_HEAVY ?? "gpt-5.6-terra",
  },
};

const DEFAULT_PROVIDER: AiProvider = (process.env.AI_DEFAULT_PROVIDER as AiProvider) ?? "kenari";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AiNotConfiguredError extends Error {
  constructor(provider: AiProvider) {
    super(`API key untuk provider "${provider}" belum di-set di environment variable`);
    this.name = "AiNotConfiguredError";
  }
}

// Kata kunci yang nandain user butuh analisis/hitungan yang lebih berat,
// bukan cuma pertanyaan singkat biasa.
const HEAVY_KEYWORDS = [
  "proyeksi",
  "skenario",
  "simulasi",
  "bandingkan",
  "perbandingan",
  "analisis mendalam",
  "rencana pensiun",
  "strategi",
  "optimal",
  "alokasi",
  "worst case",
  "best case",
  "kalau seandainya",
  "kalau misalnya",
  "berapa tahun",
  "berapa lama",
];

/**
 * Tebak apakah pesan user butuh reasoning berat. Heuristik sederhana:
 * pesan panjang ATAU mengandung kata kunci analisis/skenario/perhitungan
 * multi-langkah.
 */
export function needsHeavyReasoning(message: string): boolean {
  const lower = message.toLowerCase();
  const isLongMessage = message.length > 220;
  const hasHeavyKeyword = HEAVY_KEYWORDS.some((kw) => lower.includes(kw));
  return isLongMessage || hasHeavyKeyword;
}

/**
 * Pastikan nilai provider yang datang dari preferensi user itu valid,
 * fallback ke default kalau ternyata bukan salah satu opsi yang didukung.
 */
export function resolveProvider(value?: string | null): AiProvider {
  if (value === "kenari" || value === "sumopod") return value;
  return DEFAULT_PROVIDER;
}

/**
 * Kebalikan dari provider yang dipakai user - dipakai buat auto-fallback
 * kalau provider utama gagal.
 */
function getFallbackProvider(provider: AiProvider): AiProvider {
  return provider === "kenari" ? "sumopod" : "kenari";
}

async function callProvider(
  messages: ChatMessage[],
  heavy: boolean,
  provider: AiProvider
): Promise<string> {
  const config = PROVIDERS[provider];

  if (!config.apiKey) {
    throw new AiNotConfiguredError(provider);
  }

  const model = heavy ? config.modelHeavy : config.modelLight;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`AI provider error (${provider}, model: ${model}):`, res.status, text);
    throw new Error(`AI provider "${provider}" mengembalikan status ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`Respons AI dari provider "${provider}" tidak valid`);
  }

  return content as string;
}

/**
 * Panggil endpoint chat completions yang OpenAI-compatible. Provider bisa
 * "kenari" atau "sumopod", masing-masing punya base URL, API key, dan model
 * (ringan/berat) sendiri yang diatur lewat environment variable.
 *
 * Kalau provider pilihan user gagal (down, rate limit, belum dikonfigurasi,
 * dsb), otomatis dicoba lagi pakai provider satunya sebagai fallback,
 * transparan buat user - mereka cuma dapat jawaban seperti biasa.
 *
 * @param heavy - true buat pakai model reasoning berat, false/undefined
 *   buat model ringan.
 */
export async function callAiChat(
  messages: ChatMessage[],
  heavy = false,
  provider: AiProvider = DEFAULT_PROVIDER
): Promise<string> {
  try {
    return await callProvider(messages, heavy, provider);
  } catch (primaryError) {
    const fallbackProvider = getFallbackProvider(provider);

    console.warn(
      `AI provider "${provider}" gagal, mencoba fallback ke "${fallbackProvider}"...`,
      primaryError instanceof Error ? primaryError.message : primaryError
    );

    try {
      return await callProvider(messages, heavy, fallbackProvider);
    } catch (fallbackError) {
      console.error(
        `AI fallback ke "${fallbackProvider}" juga gagal:`,
        fallbackError instanceof Error ? fallbackError.message : fallbackError
      );
      // Kedua provider gagal - lempar error dari provider utama biar pesannya
      // tetap relevan sama pilihan user.
      throw primaryError;
    }
  }
}
