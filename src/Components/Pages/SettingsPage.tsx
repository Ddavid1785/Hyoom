import { useState, useEffect, useMemo } from "react";
import { Save, Check, X } from "lucide-react";
import { AppSettings } from "../../shared/sharedTypes.ts";

import LLMSection, { getProviderFromModel } from "../Settings/LLMSelection.tsx";
import SearchSection from "../Settings/SearchSelection.tsx";

interface SettingsPageProps {
  savedSettings: AppSettings | null;
  saveSettings: (s: AppSettings) => Promise<void>;
  loading: boolean;
}

export default function SettingsPage({ savedSettings, saveSettings, loading }: SettingsPageProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (savedSettings) {
      setLocalSettings(savedSettings);
    }
  }, [savedSettings]);

  const hasChanges = useMemo(() => {
    if (!localSettings || !savedSettings) return false;
    return JSON.stringify(localSettings) !== JSON.stringify(savedSettings);
  }, [localSettings, savedSettings]);

  useEffect(() => {
    if (hasChanges && justSaved) {
      setJustSaved(false);
    }
  }, [hasChanges, justSaved]);

  const isValid = useMemo(() => {
    if (!localSettings) return false;

    if (!localSettings.activeLlmId) return false;

    const activeLLMProvider = getProviderFromModel(localSettings.activeLlmId);

    if (!activeLLMProvider) return false;

    if (!localSettings.llmKeys[activeLLMProvider]) return false;

    return true;
  }, [localSettings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await saveSettings(localSettings);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !localSettings) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-zinc-400 font-Inter">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-12 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white font-Inter mb-3">
            Settings
          </h1>
          <p className="text-zinc-400 text-lg font-Inter">
            Manage your API keys and application preferences
          </p>
        </div>

        <div className="space-y-8 max-w-2xl bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
          <LLMSection settings={localSettings} onChange={setLocalSettings} />
          <SearchSection settings={localSettings} onChange={setLocalSettings} />
        </div>

        <div className="flex items-center gap-4 pt-6 mt-8 max-w-2xl">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !isValid}
            className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all font-Inter ${
              isSaving || !hasChanges || !isValid
                ? "bg-zinc-800/40 text-zinc-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 hover:scale-105 hover:cursor-pointer"
            }`}
          >
            {justSaved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Changes"}
              </>
            )}
          </button>

          <button
            onClick={() => setLocalSettings(savedSettings)}
            disabled={!hasChanges || isSaving}
            className={`px-6 py-3 rounded-xl font-medium transition-all font-Inter flex items-center gap-2 hover:cursor-pointer ${
              !hasChanges || isSaving
                ? "bg-zinc-900/40 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-700 hover:bg-zinc-600 text-white shadow-md hover:scale-105"
            }`}
          >
            <X size={18} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
