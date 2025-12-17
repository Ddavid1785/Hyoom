import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { ollama } from "ollama-ai-provider-v2";
import type { LanguageModel } from "ai";
import { AppSettings, InferenceProviderType, LLMMessage } from "../shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "./LLMtypes.ts";
import { getModelIdForProvider, providerDefinitions } from "./LLMChoices.ts";
import { z } from "zod"

const metaToolCallsSchema = z.array(
  z.discriminatedUnion("name", [
    z.object({ name: z.literal("tool_search"), args: z.object({ query: z.string() }) }),
    z.object({ name: z.literal("add_memory"), args: z.object({ content: z.string() }) }),
    z.object({ name: z.literal("search_memory"), args: z.object({ query: z.string() }) }),
  ])
).optional();

const responseSchema = z.object({
  thought: z.string().optional(),
  content: z.string().optional(),
  code: z.string().optional(),
  metaToolCalls: metaToolCallsSchema,
  done: z.boolean().optional()
});

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
      const provider = createGroq({
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
      return ollama(modelId)
    }
      
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

function parseLLMResponse(rawText: string): LLMResponse {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let finalParsed: unknown;
  try {
    finalParsed = JSON.parse(cleaned);
  } catch (_e) {
    try {
      const fixed = cleaned.replace(
        /("code":\s*")([\s\S]*?)("(?:\s*,\s*"|\s*}))/g, 
        (_match, start, code, end) => `${start}${code.replace(/\n/g, "\\n").replace(/\r/g, "")}${end}`
      );
      finalParsed = JSON.parse(fixed);
    } catch (_e2) {
      console.log("ℹ️ Response was plain text (not JSON). Treating as conversation.");
      return { content: rawText };
    }
  }

  try {
    const parsed = responseSchema.parse(finalParsed);
    console.log("✅ STRUCTURED RESPONSE:", parsed);
    return parsed;
  } catch (err) {
    console.warn("⚠️ LLM output failed Zod validation, returning plain content", err);
    console.log(rawText)
    return { content: rawText };
  }
}

export function createProvider(settings: AppSettings): LLMProvider {
  const { activeModelId, activeProviderId } = settings;
  
  const providerModelId = getModelIdForProvider(activeModelId, activeProviderId as InferenceProviderType);
  if (!providerModelId) {
    throw new Error(`Provider ${activeProviderId} doesn't support model ${activeModelId}`);
  }
  
  const providerConfig = settings.inferenceProviders[activeProviderId] ?? {};
  if (!providerConfig && activeProviderId!=="ollama") {
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        }))
      });

      return parseLLMResponse(result.text);
    }
  };
}