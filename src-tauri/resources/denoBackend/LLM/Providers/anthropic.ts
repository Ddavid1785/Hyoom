import { LLMMessage } from "../../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "../LLMtypes.ts";
import { parseLLMResponse } from "../responseParser.ts";

export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private modelId: string,
    private anthropicVersion = "2023-06-01"
  ) {}

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === "system");
    const conversation = messages.filter(m => m.role !== "system");

    const apiMessages: LLMMessage[] = conversation.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
    }));

    apiMessages.push({ role: "assistant", content: "{" });

    const body = {
      model: this.modelId,
      system: systemMessage?.content,
      messages: apiMessages,
      max_tokens: 4096
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
      const errText = await response.text();
      let cleanError = "Anthropic API Error";
      try {
          const jsonErr = JSON.parse(errText);
          cleanError = jsonErr.error?.message || jsonErr.error?.type || errText;
      } catch {
          cleanError = errText.substring(0, 100);
      }
      throw new Error(cleanError);
    }

    const data = await response.json();
    
    const rawBody = data?.content?.[0]?.text ?? "";
    const fullJson = "{" + rawBody;

    return parseLLMResponse(fullJson);
  }
}