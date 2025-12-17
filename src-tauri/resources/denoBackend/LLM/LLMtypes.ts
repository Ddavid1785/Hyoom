import { LLMMessage } from "../shared/sharedTypes.ts";

export interface MetaToolCallMap {
  tool_search: { query: string };
  //tool_read: { path: string };
  add_memory: { content: string }; 
  search_memory: { query: string };
}

export type MetaToolCall =
  | { name: "tool_search"; args: MetaToolCallMap["tool_search"] }
 // | { name: "tool_read"; args: MetaToolCallMap["tool_read"] }
  | { name: "add_memory"; args: MetaToolCallMap["add_memory"] }
  | { name: "search_memory"; args: MetaToolCallMap["search_memory"] };

export interface LLMResponse {
  thought?: string;
  content?: string;
  metaToolCalls?: MetaToolCall[];
  code?: string;
  done?: boolean;
}

export interface LLMProvider {
  call(messages: LLMMessage[]): Promise<LLMResponse>;
}