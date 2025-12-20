export type SearchProviderType = "brave" | "google";
export type InferenceProviderType = "openai" | "anthropic" | "google" | "groq" | "openrouter" | "ollama" | "lmstudio" | "moonshot" | "";

export interface InferenceProviderDefinition {
  id: InferenceProviderType;
  name: string;
  iconPath: string;
  requiresApiKey: boolean;
  supportsCustomBaseUrl: boolean;
  defaultBaseUrl?: string;
}

export interface InferenceProviderRuntime {
  definition: InferenceProviderDefinition;
  sdk: any;
}

export interface AppSettings {
 activeModelId: string;
  activeProviderId: InferenceProviderType;
  activeSearchProvider: SearchProviderType;

 inferenceProviders: {
    [providerId: string]: {
      apiKey?: string;
      customBaseUrl?: string;
    };
  };

  searchKeys: {
    brave?: string;
    google?: {
      apiKey: string;
      searchEngineId: string; 
    };
  };

  contextLimit?: number;
  enableCompression?: boolean;
}

export interface LLMCapabilities {
  vision: boolean;
  imageGeneration: boolean; 
  functionCalling: boolean;
}

export interface Model {
  id: string;              
  displayName: string;      
  creator: string;             
  iconPath: string;
  capabilities: LLMCapabilities;

  providerModelIds: {
    [providerId: string]: string | null;
  };
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