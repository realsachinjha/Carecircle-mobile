import "server-only";
import demoPrescription from "../../../fixtures/gemini/prescription-1.json";
import { getEnv } from "@/lib/env";
import { extractWithGemini, type ExtractResult } from "./client";
import { extractionSchema } from "./schema";

export async function extractMedicines(bytes: Uint8Array, mimeType: string): Promise<ExtractResult> {
  const env = getEnv();
  if (env.demoMode) {
    return { ok: true, extraction: extractionSchema.parse(demoPrescription) };
  }
  if (!env.geminiApiKey) {
    return { ok: false, code: "AI_NOT_CONFIGURED", raw: null };
  }
  const configuredModel = env.geminiModel?.trim();
  const primaryModel =
    configuredModel && configuredModel !== "gemini-2.5-flash" && configuredModel !== "gemini-2.5-flash-lite"
      ? configuredModel
      : "gemini-3-flash-preview";

  const firstAttempt = await extractWithGemini({
    bytes,
    mimeType,
    apiKey: env.geminiApiKey,
    model: primaryModel,
  });

  if (firstAttempt.ok || firstAttempt.code !== "AI_NOT_CONFIGURED" || primaryModel === "gemini-3.1-flash-lite") {
    return firstAttempt;
  }

  return extractWithGemini({
    bytes,
    mimeType,
    apiKey: env.geminiApiKey,
    model: "gemini-3.1-flash-lite",
  });
}
