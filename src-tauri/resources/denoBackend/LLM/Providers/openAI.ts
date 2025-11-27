import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";

function cleanJsonOutput(text: string): string {
  const clean = text.replace(/```json\n?/g, "").replace(/```/g, "");
  return clean.trim();
}


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
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();

    const raw =
      data?.choices?.[0]?.message?.content ?? "[No response from model]";
      const cleanedText = cleanJsonOutput(raw);

    // deno-lint-ignore no-explicit-any
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return { content: cleanedText };
    }

const parsedResponse: LLMResponse = {
      content: parsed.content,
      code: parsed.code,
      metaToolCalls: parsed.metaToolCalls,
    };

    return parsedResponse;
  }
}
