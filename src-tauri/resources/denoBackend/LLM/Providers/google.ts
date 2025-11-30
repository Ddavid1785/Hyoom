import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";
import { parseLLMResponse } from "../responseParser.ts";

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
           generationConfig: {
            response_mime_type: "application/json"
          }
        }),
      }
    );

if (!response.ok) {
      const errText = await response.text();
      let cleanError = `Gemini Error (${response.status})`;

      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.error?.message) {
          cleanError = jsonErr.error.message;
        } 
        else if (Array.isArray(jsonErr) && jsonErr.length > 0 && jsonErr[0].error?.message) {
           cleanError = jsonErr[0].error.message;
        }
      } catch {
        cleanError = `Gemini Error: ${errText.substring(0, 100)}`;
      }

      throw new Error(cleanError);
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return parseLLMResponse(raw);
  }
}