import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";
import { parseLLMResponse } from "../responseParser.ts";

export class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private modelId: string) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    
    const apiMessages = messages.map((m) => {
      if (!m.images || m.images.length === 0) {
        return { role: m.role, content: m.content };
      }

      // deno-lint-ignore no-explicit-any
      const contentParts: any[] = [
        { type: "text", text: m.content }
      ];

      for (const fullDataUrl of m.images) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: fullDataUrl 
          }
        });
      }

      return { role: m.role, content: contentParts };
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        response_format: { type: "json_object" }, 
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let cleanError = `OpenAI Error (${response.status})`;
      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.error?.message) {
          cleanError = jsonErr.error.message;
        }
      } catch {
        cleanError = `OpenAI Error: ${errText.substring(0, 100)}`;
      }
      throw new Error(cleanError);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    return parseLLMResponse(raw);
  }
}