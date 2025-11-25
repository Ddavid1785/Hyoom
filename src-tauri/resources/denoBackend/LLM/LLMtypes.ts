// export interface ToolCall {
//   name: string;
//   args: Record<string, unknown>;
// }

import { LLMMessage } from "../shared/sharedTypes.ts";

export interface MetaToolCallMap {
  tool_search: { query: string };
  tool_read: { path: string };
}

export type MetaToolCall =
  | { name: "tool_search"; args: MetaToolCallMap["tool_search"] }
  | { name: "tool_read"; args: MetaToolCallMap["tool_read"] };

export interface LLMResponse {
  content?: string;
  metaToolCalls?: MetaToolCall[];
  code?: string;
}

export interface LLMProvider {
  call(messages: LLMMessage[]): Promise<LLMResponse>;
}

