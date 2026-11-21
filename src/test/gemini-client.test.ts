import { describe, expect, it } from "vitest";
import fixture from "../../fixtures/gemini/prescription-1.json";
import { extractWithGemini } from "@/lib/gemini/client";

describe("gemini client", () => {
  const dummyRequest = {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: "image/jpeg",
    apiKey: "test-api-key",
    model: "gemini-2.5-flash",
  };

  it("handles successful extraction", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = { generationConfig: { responseMimeType: "" } };

    const fakeFetch = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = (init?.headers as Record<string, string>) ?? {};
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: JSON.stringify(fixture) }] },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const result = await extractWithGemini({ ...dummyRequest, fetchImpl: fakeFetch });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extraction.medicines.length).toBe(3);
    }
    expect(capturedUrl).toContain("gemini-2.5-flash");
    expect(capturedHeaders["x-goog-api-key"]).toBe("test-api-key");
    expect(capturedBody.generationConfig.responseMimeType).toBe("application/json");
  });

  it("maps error HTTP statuses correctly", async () => {
    const fetch429 = (async () => new Response("Rate limit", { status: 429 })) as unknown as typeof fetch;
    const res429 = await extractWithGemini({ ...dummyRequest, fetchImpl: fetch429 });
    expect(res429.ok).toBe(false);
    if (!res429.ok) expect(res429.code).toBe("AI_UNAVAILABLE");

    const fetch404 = (async () => new Response("Not found", { status: 404 })) as unknown as typeof fetch;
    const res404 = await extractWithGemini({ ...dummyRequest, fetchImpl: fetch404 });
    expect(res404.ok).toBe(false);
    if (!res404.ok) expect(res404.code).toBe("AI_NOT_CONFIGURED");

    const fetch403 = (async () => new Response("Forbidden", { status: 403 })) as unknown as typeof fetch;
    const res403 = await extractWithGemini({ ...dummyRequest, fetchImpl: fetch403 });
    expect(res403.ok).toBe(false);
    if (!res403.ok) expect(res403.code).toBe("AI_NOT_CONFIGURED");
  });

  it("maps safety and block reasons to AI_BLOCKED", async () => {
    const fetchBlock = (async () =>
      new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 })) as unknown as typeof fetch;
    const resBlock = await extractWithGemini({ ...dummyRequest, fetchImpl: fetchBlock });
    expect(resBlock.ok).toBe(false);
    if (!resBlock.ok) expect(resBlock.code).toBe("AI_BLOCKED");

    const fetchCandidateBlock = (async () =>
      new Response(
        JSON.stringify({
          candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "" }] } }],
        }),
        { status: 200 }
      )) as unknown as typeof fetch;
    const resCand = await extractWithGemini({ ...dummyRequest, fetchImpl: fetchCandidateBlock });
    expect(resCand.ok).toBe(false);
    if (!resCand.ok) expect(resCand.code).toBe("AI_BLOCKED");
  });

  it("handles invalid json and schema mismatches", async () => {
    const fetchNotJson = (async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "not json" }] } }],
        }),
        { status: 200 }
      )) as unknown as typeof fetch;
    const resNotJson = await extractWithGemini({ ...dummyRequest, fetchImpl: fetchNotJson });
    expect(resNotJson.ok).toBe(false);
    if (!resNotJson.ok) {
      expect(resNotJson.code).toBe("AI_INVALID_OUTPUT");
      expect(resNotJson.raw?.text).toBe("not json");
    }

    const fetchBadSchema = (async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"invalid": true}' }] } }],
        }),
        { status: 200 }
      )) as unknown as typeof fetch;
    const resBadSchema = await extractWithGemini({ ...dummyRequest, fetchImpl: fetchBadSchema });
    expect(resBadSchema.ok).toBe(false);
    if (!resBadSchema.ok) expect(resBadSchema.code).toBe("AI_INVALID_OUTPUT");
  });

  it("handles abort and timeout", async () => {
    const fetchAbort = (async () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }) as unknown as typeof fetch;
    const resAbort = await extractWithGemini({ ...dummyRequest, fetchImpl: fetchAbort });
    expect(resAbort.ok).toBe(false);
    if (!resAbort.ok) expect(resAbort.code).toBe("AI_UNAVAILABLE");

    const fetchTimeout = (async (_url: string, init?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("Timeout");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof fetch;
    const resTimeout = await extractWithGemini({
      ...dummyRequest,
      timeoutMs: 10,
      fetchImpl: fetchTimeout,
    });
    expect(resTimeout.ok).toBe(false);
    if (!resTimeout.ok) expect(resTimeout.code).toBe("AI_UNAVAILABLE");
  });
});
