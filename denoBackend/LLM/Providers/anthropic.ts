import { LLMMessage, LLMProvider, LLMResponse } from "../LLMtypes.ts";

export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private modelId: string,
    private anthropicVersion = "2023-06-01"
  ) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    // Anthropic expects the last message as "user" or "assistant"
    const lastMessage = messages[messages.length - 1];

    const body = {
      model: this.modelId,
      messages: [
        {
          role: lastMessage.role,
          content: lastMessage.content,
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.anthropicVersion,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await response.json();

    const raw = data?.completion ?? "[No response from model]";

//can be any since model might not return LLMResponse
    // deno-lint-ignore no-explicit-any
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { content: raw };
    }

const parsedResponse: LLMResponse = {
      content: parsed.content,
      code: parsed.code,
      toolCalls: parsed.toolCalls,
    };

    return parsedResponse;
  }
}
