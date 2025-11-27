import { LLMResponse } from "./LLMtypes.ts";

export function parseLLMResponse(rawText: string): LLMResponse {

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // deno-lint-ignore no-explicit-any
  let finalParsed: any = null;

  try {
    finalParsed = JSON.parse(cleaned);
  } catch (_e) {
    try {
      const fixed = cleaned.replace(
        /("code":\s*")([\s\S]*?)("(?:\s*,\s*"|\s*}))/g, 
        (_match, start, code, end) => {
          const escapedCode = code.replace(/\n/g, "\\n").replace(/\r/g, "");
          return `${start}${escapedCode}${end}`;
        }
      );
      finalParsed = JSON.parse(fixed);
    } catch (_e2) {
      console.log("ℹ️ Response was plain text (not JSON). Treating as conversation.");
      return { content: rawText };
    }
  }

  console.log("✅ PARSED RESPONSE:", finalParsed);
  return normalizeResponse(finalParsed);
}

// deno-lint-ignore no-explicit-any
function normalizeResponse(parsed: any): LLMResponse {
  return {
    content: parsed.content,
    code: parsed.code,
    metaToolCalls: parsed.metaToolCalls,
  };
}