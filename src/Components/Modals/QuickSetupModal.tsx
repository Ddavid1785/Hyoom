import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppSettings } from "../../shared/sharedTypes";
import { llmChoices, providerIcons } from "../../../src-tauri/resources/denoBackend/LLM/LLMChoices";
import { isValidApiKey } from "../../Utils/apiKeyValidation";
import LLMSelect from "../Settings/LLMSelectDropdown";
import { getProviderFromModel } from "../Settings/LLMSelection";
import SettingsInputField from "../Settings/SettingsInputField";

interface QuickSetupModalProps {
  settings: AppSettings;
  saveSettings: (s: AppSettings) => Promise<void>;
}

export default function QuickSetupModal({ settings, saveSettings }: QuickSetupModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const currentModelId = localSettings.activeLlmId;
  const activeProvider = getProviderFromModel(currentModelId);
  const currentKey = activeProvider ? (localSettings.llmKeys[activeProvider] || "") : "";

  const isValid = useMemo(() => {
    if (!activeProvider) return false;
    return isValidApiKey(currentKey);
  }, [currentKey, activeProvider]);

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    await saveSettings(localSettings);
    setIsSaving(false);
  };

  const handleKeyChange = (val: string) => {
    if (!activeProvider) return;
    setLocalSettings({
      ...localSettings,
      llmKeys: {
        ...localSettings.llmKeys,
        [activeProvider]: val,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />

      {/* Card */}
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
              To get started, please select your preferred AI model and enter your API key. 
              Your key is stored locally on your device.
            </p>
          </div>

          <div className="space-y-8 max-w-lg mx-auto">
            <div className="space-y-2 relative z-20"> 
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">
                Choose Model
              </label>
              <LLMSelect
                choices={llmChoices}
                providerIcons={providerIcons}
                selected={
                  llmChoices.find((c) => c.modelId === currentModelId) || null
                }
                onSelect={(val) =>
                  setLocalSettings({ ...localSettings, activeLlmId: val })
                }
              />
            </div>

            <div className="space-y-2 relative z-10 min-h-[110px]">
              {activeProvider ? (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-2">
                  <SettingsInputField
                    label={`${activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)} API Key`}
                    value={currentKey}
                    onChange={handleKeyChange}
                    placeholder={`sk-...`}
                    type="password"
                    required={true}
                  />
                  <p className="text-xs text-zinc-500 px-1">
                    {currentKey && !isValid ? (
                      <span className="text-red-400">Key looks too short</span>
                    ) : (
                      "Enter a valid API key to continue."
                    )}
                  </p>
                </div>
              ) : (
                <div className="h-[88px] flex items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-900/50 text-zinc-600 text-sm font-Inter italic">
                  Select a model above to enter API key
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 max-w-lg mx-auto">
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className={`
                w-full py-4 rounded-xl font-medium font-Inter text-lg
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