import { GeminiProvider } from "./Providers/google.ts";
import { OpenAIProvider } from "./Providers/openai.ts";
import { AnthropicProvider } from "./Providers/anthropic.ts";
import { AppSettings, LLMChoice } from "../shared/sharedTypes.ts";

export function createProvider(settings: AppSettings, choice: LLMChoice) {
  if (!choice) {
    throw new Error("LLM Choice is undefined");
  }

  let apiKey: string | undefined;

  switch (choice.provider) {
    case "OpenAI":
      apiKey = settings.llmKeys.openai;
      if (!apiKey) throw new Error("OpenAI API key is missing. Please add it in Settings.");
      return new OpenAIProvider(apiKey, choice.modelId);

    case "Anthropic":
      apiKey = settings.llmKeys.anthropic;
      if (!apiKey) throw new Error("Anthropic API key is missing. Please add it in Settings.");
      return new AnthropicProvider(apiKey, choice.modelId);

    case "Google":
      apiKey = settings.llmKeys.gemini;
      if (!apiKey) throw new Error("Gemini API key is missing. Please add it in Settings.");
      return new GeminiProvider(apiKey, choice.modelId);

    default:
      throw new Error(`Unknown provider: ${choice.provider}`);
  }
}