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

    // deno-lint-ignore no-explicit-any
    const apiMessages: any[] = conversation.map(m => {
      if (!m.images || m.images.length === 0) {
        return { role: m.role, content: m.content };
      }

      // deno-lint-ignore no-explicit-any
      const contentBlocks: any[] = [];
      
      for (const imgBase64 of m.images) {
        const match = imgBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match ? match[1] : "image/png",
            data: match ? match[2] : imgBase64,
          }
        });
      }

      contentBlocks.push({ type: "text", text: m.content });

      return { role: m.role, content: contentBlocks };
    });

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