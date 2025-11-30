import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";
import { parseLLMResponse } from "../responseParser.ts";

export class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private modelId: string) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        response_format: { type: "json_object" }, 
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
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