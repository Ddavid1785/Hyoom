import { LLMResponse } from "./LLMtypes.ts";

export function parseLLMResponse(rawText: string): LLMResponse {
  let cleaned = rawText.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

  try {
    const parsed = JSON.parse(cleaned);

    return {
      content: parsed.content,
      code: parsed.code,
      metaToolCalls: parsed.metaToolCalls,
    };
  } catch (_e) {
    return {
      content: rawText
    };
  }
}