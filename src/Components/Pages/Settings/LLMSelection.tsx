import { Bot } from "lucide-react";
import SettingsInputField from "./SettingsInputField.tsx";
import LLMSelect from "./LLMSelectDropdown.tsx";
import ProviderSelect from "./ProviderSelect.tsx"; 
import { AppSettings, InferenceProviderType } from "../../../shared/sharedTypes.ts";
import { findModel, getProvidersForModel, models, providerDefinitions } from "../../../../src-tauri/resources/denoBackend/LLM/LLMChoices.ts";

interface LLMSectionProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export default function LLMSection({ settings, onChange }: LLMSectionProps) {
  const selectedModel = findModel(settings.activeModelId);
  const availableProviders = selectedModel ? getProvidersForModel(settings.activeModelId) : [];
  const currentProvider = settings.activeProviderId as InferenceProviderType;
  const providerConfig = settings.inferenceProviders[currentProvider];
  const currentKey = providerConfig?.apiKey || "";
  const providerDef = currentProvider ? providerDefinitions[currentProvider] : null;

  const handleModelChange = (modelId: string) => {
    const newModel = findModel(modelId);
    if (!newModel) return;

    const supportedProviders = getProvidersForModel(modelId);
    
    const newProvider = supportedProviders.includes(currentProvider as InferenceProviderType)
      ? currentProvider
      : supportedProviders[0];

    onChange({
      ...settings,
      activeModelId: modelId,
      activeProviderId: newProvider,
    });
  };

  const handleProviderChange = (providerId: InferenceProviderType) => {
    onChange({
      ...settings,
      activeProviderId: providerId,
    });
  };

  const handleKeyChange = (val: string) => {
    if (!currentProvider) return;
    onChange({
      ...settings,
      inferenceProviders: {
        ...settings.inferenceProviders,
        [currentProvider]: {
          ...providerConfig,
          apiKey: val,
        },
      },
    });
  };

  const handleBaseUrlChange = (val: string) => {
    if (!currentProvider) return;
    onChange({
      ...settings,
      inferenceProviders: {
        ...settings.inferenceProviders,
        [currentProvider]: {
          ...providerConfig,
          customBaseUrl: val || undefined,
        },
      },
    });
  };

  const creatorIcons: Record<string, string> = {};
  models.forEach(model => {
    if (!creatorIcons[model.creator]) {
      creatorIcons[model.creator] = model.iconPath;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="text-blue-400" size={20} />
        <h3 className="text-lg font-medium text-white font-Inter">
          Model & Intelligence
        </h3>
      </div>

      {/* Model Selection */}
      <LLMSelect
        models={models}
        creatorIcons={creatorIcons}
        selected={selectedModel || null}
        onSelect={handleModelChange}
      />

      {/* Provider Selection (if multiple providers support this model) */}
      {selectedModel && availableProviders.length > 1 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ProviderSelect
            providers={availableProviders}
            selected={currentProvider}
            onSelect={handleProviderChange}
          />
        </div>
      )}

      {/* API Key Input */}
      {providerDef && providerDef.requiresApiKey && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <SettingsInputField
            label={`${providerDef.name} API Key`}
            value={currentKey}
            onChange={handleKeyChange}
            placeholder={`Enter your ${providerDef.name} API key`}
            type="password"
            required={true}
            helpText={`This key is used when accessing ${selectedModel?.displayName || 'models'} via ${providerDef.name}.`}
          />
        </div>
      )}

      {/* Custom Base URL (if provider supports it) */}
      {providerDef && providerDef.supportsCustomBaseUrl && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <SettingsInputField
            label={`${providerDef.name} Base URL (Optional)`}
            value={providerConfig?.customBaseUrl || ""}
            onChange={handleBaseUrlChange}
            placeholder={providerDef.defaultBaseUrl ?? "no default base url for this provider"}
            type="text"
            required={false}
            helpText="Leave empty to use the default endpoint."
          />
        </div>
      )}
      
      {!selectedModel && (
        <p className="text-sm text-zinc-500 italic font-Inter">
          Select a model above to configure its provider settings.
        </p>
      )}
    </div>
  );
}