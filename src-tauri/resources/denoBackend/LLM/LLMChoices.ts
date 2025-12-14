import { Model, InferenceProviderType, InferenceProviderDefinition } from "../shared/sharedTypes.ts"

export const providerDefinitions: Record<InferenceProviderType, InferenceProviderDefinition> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    iconPath: "/LLMProviderIcons/OpenAI/Openai.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    defaultBaseUrl: "https://api.openai.com/v1"
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    iconPath: "/LLMProviderIcons/Anthropic/Anthropic.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    defaultBaseUrl: "https://api.anthropic.com/v1"
  },
  google: {
    id: "google",
    name: "Google AI",
    iconPath: "/LLMProviderIcons/Google/Google.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta"
  },
  groq: {
    id: "groq",
    name: "Groq",
    iconPath: "/LLMProviderIcons/Groq/groq.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: true,
    defaultBaseUrl: "https://api.groq.com/openai/v1"
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    iconPath: "/LLMProviderIcons/OpenRouter/openrouter.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: false,
    defaultBaseUrl: "https://openrouter.ai/api/v1"
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    iconPath: "/LLMProviderIcons/Ollama/ollama.png",
    requiresApiKey: false,
    supportsCustomBaseUrl: true,
    defaultBaseUrl: "http://localhost:11434"
  }
};

export const models: Model[] = [
  // OpenAI Models
  {
    id: "gpt-5",
    displayName: "GPT-5",
    creator: "OpenAI",
    iconPath: "/LLMProviderIcons/OpenAI/openAI.png",
    capabilities: { vision: true, imageGeneration: true, functionCalling: true },
    providerModelIds: {
      openai: "gpt-5",
      openrouter: "openai/gpt-5", // TODO: Verify OpenRouter model ID
      groq: null, // Groq likely won't have GPT-5
      anthropic: null,
      google: null,
      ollama: null
    }
  },
  {
    id: "gpt-4.1",
    displayName: "GPT-4.1",
    creator: "OpenAI",
    iconPath: "/LLMProviderIcons/OpenAI/openAI.png",
    capabilities: { vision: true, imageGeneration: true, functionCalling: true },
    providerModelIds: {
      openai: "gpt-4.1",
      openrouter: "openai/gpt-4.1", // TODO: Verify OpenRouter model ID
      groq: null,
      anthropic: null,
      google: null,
      ollama: null
    }
  },
  
  // Anthropic Models
  {
    id: "claude-4.0-sonnet",
    displayName: "Sonnet 4.0",
    creator: "Anthropic",
    iconPath: "/LLMProviderIcons/Anthropic/claude.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      anthropic: "claude-sonnet-4-0", // TODO: Verify exact model string
      openrouter: "anthropic/claude-sonnet-4", // TODO: Verify OpenRouter model ID
      openai: null,
      groq: null,
      google: null,
      ollama: null
    }
  },
  {
    id: "claude-4.5-sonnet",
    displayName: "Sonnet 4.5",
    creator: "Anthropic",
    iconPath: "/LLMProviderIcons/Anthropic/claude.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      anthropic: "claude-sonnet-4-5", // Based on the product info you provided earlier
      openrouter: "anthropic/claude-sonnet-4.5", // TODO: Verify OpenRouter model ID
      openai: null,
      groq: null,
      google: null,
      ollama: null
    }
  },
  
  // Google Models
  {
    id: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    creator: "Google",
    iconPath: "/LLMProviderIcons/Google/gemini.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      google: "gemini-2.5-pro", // TODO: Verify exact model string
      openrouter: "google/gemini-2.5-pro", // TODO: Verify OpenRouter model ID
      openai: null,
      anthropic: null,
      groq: null,
      ollama: null
    }
  },
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    creator: "Google",
    iconPath: "/LLMProviderIcons/Google/gemini.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      google: "gemini-2.5-flash", // TODO: Verify exact model string
      openrouter: "google/gemini-2.5-flash", // TODO: Verify OpenRouter model ID
      openai: null,
      anthropic: null,
      groq: null,
      ollama: null
    }
  }
];

export function findModel(modelId: string): Model | undefined {
  return models.find((m) => m.id === modelId);
}

export function getModelIdForProvider(modelId: string, providerId: InferenceProviderType): string | null {
  const model = findModel(modelId);
  if (!model) return null;
  
  return model.providerModelIds[providerId] ?? null;
}

export function getModelsForProvider(providerId: InferenceProviderType): Model[] {
  return models.filter((m) => m.providerModelIds[providerId] !== null);
}

export function getProvidersForModel(modelId: string): InferenceProviderType[] {
  const model = findModel(modelId);
  if (!model) return [];
  
  return Object.entries(model.providerModelIds)
    .filter(([_, id]) => id !== null)
    .map(([providerId]) => providerId as InferenceProviderType);
}