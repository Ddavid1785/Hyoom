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