export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  code?: string;
}

export interface LLMProvider {
  call(messages: LLMMessage[]): Promise<LLMResponse>;
}

