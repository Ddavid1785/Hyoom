import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";

export class GeminiProvider implements LLMProvider {
  constructor(private apiKey: string, private modelId: string) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();

const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "[No response from model]";

    // deno-lint-ignore no-explicit-any
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { content: raw };
    }
    console.log("PARSED RESPONSE IS: ", parsed)
const parsedResponse: LLMResponse = {
      content: parsed.content,
      code: parsed.code,
      metaToolCalls: parsed.metaToolCalls,
    };

    return parsedResponse;
  }
}
