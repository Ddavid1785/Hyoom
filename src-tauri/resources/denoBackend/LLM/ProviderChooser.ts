import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { AppSettings, InferenceProviderType, LLMMessage } from "../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "./LLMtypes.ts";
import { getModelIdForProvider, providerDefinitions } from "./LLMChoices.ts";

function createModel(
  providerId: InferenceProviderType,
  modelId: string,
  config: { apiKey?: string; customBaseUrl?: string }
): LanguageModel {
  const definition = providerDefinitions[providerId];
  
  switch (providerId) {
    case "openai": {
      const provider = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.customBaseUrl
      });
      return provider(modelId);
    }
      
    case "anthropic": {
      const provider = createAnthropic({
        apiKey: config.apiKey,
        baseURL: config.customBaseUrl
      });
      return provider(modelId);
    }
      
    case "google": {
      const provider = createGoogleGenerativeAI({
        apiKey: config.apiKey,
        baseURL: config.customBaseUrl
      });
      return provider(modelId);
    }
      
    case "groq": {
      const provider = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.customBaseUrl || definition.defaultBaseUrl
      });
      return provider(modelId);
    }
      
    case "openrouter": {
      const provider = createOpenAI({
        apiKey: config.apiKey,
        baseURL: definition.defaultBaseUrl
      });
      return provider(modelId);
    }
      
    case "ollama": {
      const provider = createOpenAI({
        baseURL: config.customBaseUrl || definition.defaultBaseUrl
      });
      return provider(modelId);
    }
      
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

export function createProvider(settings: AppSettings): LLMProvider {
  const { activeModelId, activeProviderId } = settings;
  
  const providerModelId = getModelIdForProvider(activeModelId, activeProviderId as InferenceProviderType);
  if (!providerModelId) {
    throw new Error(`Provider ${activeProviderId} doesn't support model ${activeModelId}`);
  }
  
  const providerConfig = settings.inferenceProviders[activeProviderId];
  if (!providerConfig) {
    throw new Error(`No configuration found for provider: ${activeProviderId}`);
  }
  
  const model = createModel(
    activeProviderId as InferenceProviderType,
    providerModelId,
    providerConfig
  );
  
  return {
    call: async (messages: LLMMessage[]): Promise<LLMResponse> => {
      const result = await generateText({
        model,
        messages: messages.map(msg => ({
          role: msg.role==="assistant" ? "assistant" : "user",
          content: msg.content
        }))
      });
      
      const response: LLMResponse = {
        content: result.text
      };
      
      const codeMatch = result.text.match(/```(?:typescript|javascript|ts|js)\n([\s\S]*?)```/);
      if (codeMatch) {
        response.code = codeMatch[1];
        response.content = result.text.replace(/```(?:typescript|javascript|ts|js)\n[\s\S]*?```/, '').trim();
      }
      
      return response;
    }
  };
}