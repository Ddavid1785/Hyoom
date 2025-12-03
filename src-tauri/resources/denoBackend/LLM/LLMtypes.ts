import { LLMMessage } from "../shared/sharedTypes.ts";

export interface MetaToolCallMap {
  tool_search: { query: string };
  tool_read: { path: string };
  add_memory: { content: string }; 
}

export type MetaToolCall =
  | { name: "tool_search"; args: MetaToolCallMap["tool_search"] }
  | { name: "tool_read"; args: MetaToolCallMap["tool_read"] }
  | { name: "add_memory"; args: MetaToolCallMap["add_memory"] };

export interface LLMResponse {
  content?: string;
  metaToolCalls?: MetaToolCall[];
  code?: string;
}

export interface LLMProvider {
  call(messages: LLMMessage[]): Promise<LLMResponse>;
}