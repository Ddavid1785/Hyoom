export type Tab = "chat" | "tools" | "settings";

export interface AppSettings {
    llmApiKey: string;
    //googleSearchApiKey: string;
    //googleSearchEngineId: string;
    llmChoice: string
}

export interface ImageData {
  id: string;
  preview: string;
  file: File;
}

export interface Prompt {
  text: string;
  baseImages?: string[] | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string; 
  timestamp: Date;
  images?: string[];
}

export interface LLMChoice{
  name: string,
  pathToIcon: string,
  provider: string; 
  modelId: string;
}