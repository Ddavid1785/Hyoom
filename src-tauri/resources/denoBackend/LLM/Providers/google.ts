import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";
import { parseLLMResponse } from "../responseParser.ts";

export class GeminiProvider implements LLMProvider {
  constructor(private apiKey: string, private modelId: string) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    const contents = messages.map((m) => {
      // deno-lint-ignore no-explicit-any
      const parts: any[] = [{ text: m.content }];

      if (m.images && m.images.length > 0) {
        for (const imgBase64 of m.images) {
          const match = imgBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
          
          parts.push({
            inline_data: {
              mime_type: match ? match[1] : "image/png",
              data: match ? match[2] : imgBase64,
            },
          });
        }
      }

      return {
        role: m.role === "user" ? "user" : "model",
        parts: parts,
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: contents,
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