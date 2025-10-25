export interface Prompt{
    text: string,
    baseImage: string | null,
}

export interface ChatMessage {
  role: "user" | "model"; 
  parts: Array<{ text: string }>;
}

export interface ChatPrompt extends Prompt {
  chatHistory?: ChatMessage[];
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
  displayContent?: string;
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
    rawAiResponse: string,
}
