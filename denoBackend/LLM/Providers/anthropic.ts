import { LLMMessage, LLMProvider, LLMResponse } from "../types.ts";

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

    const text = data?.completion ?? "[No response from model]";

    return text;
  }
}
