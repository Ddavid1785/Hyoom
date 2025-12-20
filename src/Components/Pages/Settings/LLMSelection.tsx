import { Bot, PlusCircle } from "lucide-react";
import SettingsInputField from "./SettingsInputField.tsx";
import LLMSelect from "./LLMSelectDropdown.tsx";
import ProviderSelect from "./ProviderSelect.tsx";
import {
  AppSettings,
  InferenceProviderType,
  Model,
} from "../../../shared/sharedTypes.ts";
import { providerDefinitions } from "../../../../src-tauri/resources/denoBackend/LLM/LLMStatic.ts";
import { useState } from "react";
import AddModelModal from "../../Modals/AddModelModal.tsx";

interface LLMSectionProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  allModels: Model[];
  onAddModel: (m: Model) => void;
  fetchOllama: (url?: string) => Promise<any[]>;
  fetchLMStudio: (url?: string) => Promise<any[]>;
  customModels: Model[];
  onRemoveModel: (modelId: string) => Promise<void>;
}

export default function LLMSection({
  settings,
  onChange,
  allModels,
  onAddModel,
  fetchOllama,
  fetchLMStudio,
  customModels,
  onRemoveModel,
}: LLMSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const selectedModel = allModels.find((m) => m.id === settings.activeModelId);

 const handleRemoveModel = async (modelIdToRemove: string) => {
    await onRemoveModel(modelIdToRemove);

    if (settings.activeModelId === modelIdToRemove) {
        onChange({
          ...settings,
          activeModelId: "",
          activeProviderId: "",
        });
    }
  };

  const getProvidersForModelLocal = (modelId: string) => {
    const m = allModels.find((mod) => mod.id === modelId);
    if (!m) return [];

    return Object.entries(m.providerModelIds)
      .filter(([_, id]) => id !== null)
      .map(([providerId]) => providerId as InferenceProviderType);
  };

  const availableProviders = selectedModel
    ? getProvidersForModelLocal(settings.activeModelId)
    : [];

  const currentProvider = settings.activeProviderId as InferenceProviderType;
  const providerConfig = settings.inferenceProviders[currentProvider];
  const currentKey = providerConfig?.apiKey || "";
  const providerDef = currentProvider
    ? providerDefinitions[currentProvider]
    : null;

  const handleModelChange = (modelId: string) => {
    const newModel = allModels.find((m) => m.id === modelId);
    if (!newModel) return;

    const supportedProviders = getProvidersForModelLocal(modelId);

    const newProvider = supportedProviders.includes(
      currentProvider as InferenceProviderType
    )
      ? currentProvider
      : supportedProviders[0];

    onChange({
      ...settings,
      activeModelId: modelId,
      activeProviderId: newProvider,
    });
  };

  const handleCustomModelAdd = (newModel: Model) => {
    onAddModel(newModel);

    const validProviders = Object.entries(newModel.providerModelIds)
      .filter(([_, id]) => id !== null)
      .map(([k]) => k as InferenceProviderType);

    if (validProviders.length > 0) {
      onChange({
        ...settings,
        activeModelId: newModel.id,
        activeProviderId: validProviders[0],
      });
    }
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
  allModels.forEach((model) => {
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
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <LLMSelect
            models={allModels}
            creatorIcons={creatorIcons}
            selected={selectedModel || null}
            onSelect={handleModelChange}
            customModels={customModels}
            onRemove={handleRemoveModel} 
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors"
          title="Add Custom Model"
        >
          <PlusCircle size={20} />
        </button>
      </div>

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
            helpText={`This key is used when accessing ${
              selectedModel?.displayName || "models"
            } via ${providerDef.name}.`}
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
            placeholder={
              providerDef.defaultBaseUrl ??
              "no default base url for this provider"
            }
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
      <AddModelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleCustomModelAdd}
        fetchOllama={fetchOllama}
        fetchLMStudio={fetchLMStudio}
      />
    </div>
  );
}
