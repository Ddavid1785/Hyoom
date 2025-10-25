export interface Prompt{
    text: string,
    baseImage: string | null,
}

export interface AppSettings {
    geminiApiKey: string;
    googleSearchApiKey: string;
    googleSearchEngineId: string;
}

export type Tab = "chat" | "tools" | "settings";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ToolResult{
toolName: string,
success: boolean,
result: string,
error: string | null
}
 
export type ExecutionMode = "Independent" | "SequentialChain" | "DependentChain" | "SelfReprompt"

export interface GroupResult{
    mode: ExecutionMode,
    toolResults: ToolResult[],
    userMessage: string | null
}

export interface TaskResponse{
    groups: GroupResult[]
}
