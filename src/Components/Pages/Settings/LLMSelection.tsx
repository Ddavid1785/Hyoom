import { Bot } from "lucide-react";
import SettingsInputField from "./SettingsInputField.tsx";
import LLMSelect from "./LLMSelectDropdown.tsx";
import { llmChoices, providerIcons } from "../../../../src-tauri/resources/denoBackend/LLM/LLMChoices.ts";
import { AppSettings, LLMProviderType } from "../../../shared/sharedTypes.ts";

interface LLMSectionProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export function getProviderFromModel(modelId: string): LLMProviderType | "" {
  if (!modelId) return "";

  if (modelId.startsWith("gpt") || modelId.startsWith("o1")) return "openai";
  if (modelId.startsWith("claude")) return "anthropic";
  if (modelId.startsWith("gemini")) return "gemini";

  return "";
}

export default function LLMSection({ settings, onChange }: LLMSectionProps) {
  const currentModel = settings.activeLlmId || llmChoices[0].name;
  const activeProvider = getProviderFromModel(currentModel);
  const currentKey = activeProvider
    ? settings.llmKeys[activeProvider] || ""
    : "";

  const handleKeyChange = (val: string) => {
    if (!activeProvider) return;
    onChange({
      ...settings,
      llmKeys: {
        ...settings.llmKeys,
        [activeProvider]: val,
      },
    });
  };

    return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="text-blue-400" size={20} />
        <h3 className="text-lg font-medium text-white font-Inter">
          Model & Intelligence
        </h3>
      </div>

     <LLMSelect
        choices={llmChoices}
        providerIcons={providerIcons}
        selected={
          llmChoices.find((choice) => choice.modelId === settings.activeLlmId) || null
        }
        onSelect={(value) => onChange({ ...settings, activeLlmId: value })}
      />

      {activeProvider && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <SettingsInputField
            label={`${activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)} API Key`}
            value={currentKey}
            onChange={handleKeyChange}
            placeholder={`sk-... (Enter your ${activeProvider} key)`}
            type="password"
            required={true}
            helpText={`This key is saved specifically for ${activeProvider} models.`}
          />
        </div>
      )}
      
      {!activeProvider && (
        <p className="text-sm text-zinc-500 italic font-Inter">
          Select a model above to configure its API key.
        </p>
      )}
    </div>
  );
}