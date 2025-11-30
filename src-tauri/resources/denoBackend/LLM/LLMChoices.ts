import { LLMChoice } from "../shared/sharedTypes.ts";

export const llmChoices: LLMChoice[] = [
  // OpenAI
  { 
    name: "GPT 5", 
    provider: "OpenAI",
    pathToIcon: "/LLMProviderIcons/OpenAI/openAI.png",
    modelId: "gpt-5" 
  },
  {
    name: "GPT 4.1",
    provider: "OpenAI",
    pathToIcon: "/LLMProviderIcons/OpenAI/openAI.png",
    modelId: "gpt-4.1"
  },

  // Anthropic
  {
    name: "Sonnet 4.0",
    provider: "Anthropic",
    pathToIcon: "/LLMProviderIcons/Anthropic/claude.png",
    modelId: "claude-3.7-sonnet"
  },
  {
    name: "Sonnet 4.5",
    provider: "Anthropic",
    pathToIcon: "/LLMProviderIcons/Anthropic/claude.png",
    modelId: "claude-3.5-sonnet"
  },

  // Google
  {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    pathToIcon: "/LLMProviderIcons/Google/gemini.png",
    modelId: "gemini-2.5-pro"
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "Google",
    pathToIcon: "/LLMProviderIcons/Google/gemini.png",
    modelId: "gemini-2.5-flash"
  }
];

export const providerIcons: Record<string, string> = {Google:"/LLMProviderIcons/Google/Google.png",
    OpenAI:"/LLMProviderIcons/OpenAI/openAI.png",
     Anthropic:"/LLMProviderIcons/Anthropic/Anthropic.png"};

export function findLLMChoice(modelId: string) {
  return llmChoices.find((choice) => choice.modelId === modelId);
}