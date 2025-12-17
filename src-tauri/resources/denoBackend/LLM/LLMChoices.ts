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
    name: "Google Generative AI",
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
    defaultBaseUrl: "http://localhost:11434/api"
  },
  lmstudio: {
  id: "lmstudio",
  name: "LM Studio",
  iconPath: "/LLMProviderIcons/LMStudio/lmstudio.png",
  requiresApiKey: false,
  supportsCustomBaseUrl: true,
  defaultBaseUrl: "http://localhost:1234/v1"
},
    moonshot: {
    id: "moonshot",
    name: "Moonshot",
    iconPath: "/LLMProviderIcons/Moonshot/moonshot.png",
    requiresApiKey: true,
    supportsCustomBaseUrl: false,
    defaultBaseUrl: ""
  }
};

export const models: Model[] = [
  // OpenAI Models
  {
    id: "gpt-5",
    displayName: "GPT-5",
    creator: "OpenAI",
    iconPath: "/LLMProviderIcons/OpenAI/Openai.png",
    capabilities: { vision: true, imageGeneration: true, functionCalling: true },
    providerModelIds: {
      openai: "gpt-5",
      openrouter: "openai/gpt-5",
      groq: null, 
      anthropic: null,
      google: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
    }
  },
  {
    id: "gpt-4.1",
    displayName: "GPT-4.1",
    creator: "OpenAI",
    iconPath: "/LLMProviderIcons/OpenAI/Openai.png",
    capabilities: { vision: true, imageGeneration: true, functionCalling: true },
    providerModelIds: {
      openai: "gpt-4.1",
      openrouter: "openai/gpt-4.1", 
      groq: null, 
      anthropic: null,
      google: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
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
      anthropic: "claude-sonnet-4-0",
      openrouter: "anthropic/claude-sonnet-4",
      openai: null,
      groq: null,
      google: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
    }
  },
  {
    id: "claude-4.5-sonnet",
    displayName: "Sonnet 4.5",
    creator: "Anthropic",
    iconPath: "/LLMProviderIcons/Anthropic/claude.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      anthropic: "claude-sonnet-4-5",
      openrouter: "anthropic/claude-sonnet-4.5", 
      openai: null,
      groq: null,
      google: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
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
      google: "gemini-2.5-pro",
      openrouter: "google/gemini-2.5-pro",
      openai: null,
      anthropic: null,
      groq: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
    }
  },
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    creator: "Google",
    iconPath: "/LLMProviderIcons/Google/gemini.png",
    capabilities: { vision: true, imageGeneration: false, functionCalling: true },
    providerModelIds: {
      google: "gemini-2.5-flash",
      openrouter: "google/gemini-2.5-flash",
      openai: null,
      anthropic: null,
      groq: null,
      ollama: null,
      lmstudio: null,
      moonshot: null
    }
  },
  {
  id: "chatgpt-oss-120b",
  displayName: "ChatGPT OSS 120B",
  creator: "OpenAI",
  iconPath: "/LLMProviderIcons/OpenAI/Openai.png",
  capabilities: {
    vision: false,
    imageGeneration: false,
    functionCalling: true
  },
  providerModelIds: {
    groq: "openai/gpt-oss-120b",
    openrouter: null,
    openai: null,
    anthropic: null,
    google: null,
    ollama: null,
    lmstudio: null,
    moonshot: null
  }
},
  {
  id: "kimi-k2",
  displayName: "Kimi K2",
  creator: "Moonshot",
  iconPath: "/LLMProviderIcons/Moonshot/moonshot.png",
  capabilities: {
    vision: false,
    imageGeneration: false,
    functionCalling: true
  },
  providerModelIds: {
    groq: "moonshotai/kimi-k2-instruct-0905",
    openrouter: null,
    openai: null,
    anthropic: null,
    google: null,
    ollama: null,
    lmstudio: null,
    moonshot: null
  }
},
  {
  id: "gemma3-4b",
  displayName: "Gemma 3-4b",
  creator: "Google",
  iconPath: "/LLMProviderIcons/Google/gemini.png",
  capabilities: {
    vision: false,
    imageGeneration: false,
    functionCalling: true
  },
  providerModelIds: {
    ollama: "gemma3-4b-it:latest",
    lmstudio: "hermes-3-llama-3.1-8b",
    openrouter: null,
    openai: null,
    anthropic: null,
    google: null,
    groq: null,
    moonshot: null
  }
},
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