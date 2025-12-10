export type SearchProviderType = "brave" | "google";
export type LLMProviderType = "openai" | "anthropic" | "google";

export interface AppSettings {
  activeLlmId: string;
  activeSearchProvider: SearchProviderType;

  llmKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };

  searchKeys: {
    brave?: string;
    google?: {
      apiKey: string;
      searchEngineId: string; 
    };
  };

  contextLimit?: number;
}

export interface LLMCapabilities {
  vision: boolean;
  imageGeneration: boolean; 
  functionCalling: boolean;
}

export interface LLMChoice{
  name: string,
  pathToIcon: string,
  provider: string; 
  modelId: string;
  capabilities: LLMCapabilities;
}

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  thought?: string;
}

export interface StoredMemory {
  id: string;
  content: string;
  embedding: number[]; 
  timestamp: string;
}