import { GeminiProvider } from "./Providers/google.ts";
import { OpenAIProvider } from "./Providers/openAI.ts";
import { AnthropicProvider } from "./Providers/anthropic.ts";
import { LLMChoice } from "../../src/types.ts";

export function createProvider(apiKey: string, choice: LLMChoice){

if (!choice) {
  throw new Error("Choice is undefined " + choice);
}

switch (choice.provider) {
  case "OpenAI":
   return new OpenAIProvider(apiKey, choice.modelId);
  case "Anthropic":
    return new AnthropicProvider(apiKey, choice.modelId);
  case "Google":
    return new GeminiProvider(apiKey, choice.modelId);
  default:
    throw new Error("Unknown provider " + choice.provider);
}
}

