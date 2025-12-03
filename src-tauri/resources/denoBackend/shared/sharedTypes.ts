export type SearchProviderType = "brave" | "google";
export type LLMProviderType = "openai" | "anthropic" | "gemini";

export interface AppSettings {
  activeLlmId: string;
  activeSearchProvider: SearchProviderType;

  llmKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
  };

  searchKeys: {
    brave?: string;
    google?: {
      apiKey: string;
      searchEngineId: string; 
    };
  };
}

export interface LLMChoice{
  name: string,
  pathToIcon: string,
  provider: string; 
  modelId: string;
}

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  thought?: string;
}