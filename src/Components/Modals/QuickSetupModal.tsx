import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { AppSettings, InferenceProviderType } from "../../shared/sharedTypes";
import { providerDefinitions } from "../../../src-tauri/resources/denoBackend/LLM/LLMStatic";
import { isValidApiKey } from "../../Utils/apiKeyValidation";
import LLMSelect from "../Pages/Settings/LLMSelectDropdown";
import ProviderSelect from "../Pages/Settings/ProviderSelect";
import SettingsInputField from "../Pages/Settings/SettingsInputField";
import { useCustomModels } from "../../Hooks/useCustomModels";

interface QuickSetupModalProps {
  settings: AppSettings;
  saveSettings: (s: AppSettings) => Promise<void>;
  onSkip: () => void;
}

export default function QuickSetupModal({
  settings,
  saveSettings,
  onSkip,
}: QuickSetupModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const { allModels } = useCustomModels();

  const selectedModel = useMemo(
    () => allModels.find((m) => m.id === localSettings.activeModelId),
    [allModels, localSettings.activeModelId]
  );

  const availableProviders = useMemo(() => {
    if (!selectedModel) return [];
    return Object.entries(selectedModel.providerModelIds)
      .filter(([_, id]) => id !== null)
      .map(([providerId]) => providerId as InferenceProviderType);
  }, [selectedModel]);

  const currentProvider =
    localSettings.activeProviderId as InferenceProviderType;
  const providerConfig = localSettings.inferenceProviders[currentProvider];
  const currentKey = providerConfig?.apiKey || "";
  const providerDef = currentProvider
    ? providerDefinitions[currentProvider]
    : null;

  const isValid = useMemo(() => {
    if (!localSettings.activeModelId || !localSettings.activeProviderId)
      return false;
    if (!providerDef) return false;

    if (providerDef.requiresApiKey) {
      return isValidApiKey(currentKey);
    }

    return true;
  }, [localSettings, currentKey, providerDef]);

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    await saveSettings(localSettings);
    setIsSaving(false);
  };

  const handleModelChange = (modelId: string) => {
    const newModel = allModels.find(m => m.id === modelId);
    if (!newModel) return;

    const supportedProviders = Object.entries(newModel.providerModelIds)
      .filter(([_, id]) => id !== null)
      .map(([pid]) => pid as InferenceProviderType);

    const newProvider = supportedProviders.includes(
      currentProvider as InferenceProviderType
    )
      ? currentProvider
      : supportedProviders[0];

    setLocalSettings({
      ...localSettings,
      activeModelId: modelId,
      activeProviderId: newProvider,
    });
  };

  const handleProviderChange = (providerId: InferenceProviderType) => {
    setLocalSettings({
      ...localSettings,
      activeProviderId: providerId,
    });
  };

  const handleKeyChange = (val: string) => {
    if (!currentProvider) return;
    setLocalSettings({
      ...localSettings,
      inferenceProviders: {
        ...localSettings.inferenceProviders,
        [currentProvider]: {
          ...providerConfig,
          apiKey: val,
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="
          relative w-full max-w-2xl 
          bg-zinc-900 border border-zinc-800 
          rounded-2xl shadow-2xl shadow-black/50
          flex flex-col
        "
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all z-10"
          title="Skip setup"
        >
          <X size={20} />
        </button>

        <div className="h-1 w-full bg-linear-to-r from-blue-500 via-purple-500 to-blue-500 rounded-t-2xl" />

        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 mb-5">
              <Sparkles className="text-blue-400" size={28} />
            </div>
            <h2 className="text-3xl font-bold text-white font-Inter mb-3">
              Welcome to Hyoom
            </h2>
            <p className="text-zinc-400 font-Inter text-base leading-relaxed max-w-md mx-auto">
              Get started by selecting a model and provider. You can always
              change these later in Settings.
            </p>
          </div>

          <div className="space-y-6 max-w-lg mx-auto">
            <div className="space-y-2 relative z-20">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">
                Choose Model
              </label>
              <LLMSelect
                models={allModels}
                creatorIcons={creatorIcons}
                selected={selectedModel || null}
                onSelect={handleModelChange}
              />
            </div>

            {selectedModel && availableProviders.length > 1 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                <ProviderSelect
                  providers={availableProviders}
                  selected={currentProvider}
                  onSelect={handleProviderChange}
                />
              </div>
            )}

            <div className="space-y-2 relative z-10 min-h-[110px]">
              {providerDef && providerDef.requiresApiKey ? (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-2">
                  <SettingsInputField
                    label={`${providerDef.name} API Key`}
                    value={currentKey}
                    onChange={handleKeyChange}
                    placeholder={`Enter your ${providerDef.name} API key`}
                    type="password"
                    required={true}
                  />
                  <p className="text-xs text-zinc-500 px-1">
                    {currentKey && !isValidApiKey(currentKey) ? (
                      <span className="text-red-400">Key looks too short</span>
                    ) : (
                      "Your API key is stored locally and never shared."
                    )}
                  </p>
                </div>
              ) : providerDef && !providerDef.requiresApiKey ? (
                <div className="h-[88px] flex items-center justify-center border border-green-500/20 rounded-xl bg-green-500/5 text-green-400 text-sm font-Inter">
                  No API key required for {providerDef.name}
                </div>
              ) : (
                <div className="h-[88px] flex items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-900/50 text-zinc-600 text-sm font-Inter italic">
                  Select a model and provider above
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 max-w-lg mx-auto flex gap-3">
            <button
              onClick={onSkip}
              className="
                flex-1 py-4 rounded-xl font-medium font-Inter text-base
                bg-zinc-800 hover:bg-zinc-700 text-zinc-300
                transition-all duration-200 cursor-pointer
              "
            >
              Skip for Now
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className={`
                flex-1 py-4 rounded-xl font-medium font-Inter text-base
                flex items-center justify-center gap-2
                transition-all duration-200
                ${
                  isValid && !isSaving
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:scale-[1.02] cursor-pointer"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  Get Started <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
