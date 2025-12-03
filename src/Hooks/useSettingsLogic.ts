import { useState, useEffect, useMemo } from "react";
import { AppSettings } from "../shared/sharedTypes";
import { getProviderFromModel } from "../Components/Pages/Settings/LLMSelection";
import { isValidApiKey } from "../Utils/apiKeyValidation";

export function useSettingsLogic(
  savedSettings: AppSettings | null,
  saveSettingsFn: (s: AppSettings) => Promise<void>
) {
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

    const currentKey = localSettings.llmKeys[activeLLMProvider];
    return isValidApiKey(currentKey);
  }, [localSettings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await saveSettingsFn(localSettings);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (savedSettings) setLocalSettings(savedSettings);
  };

  return {
    localSettings,
    setLocalSettings,
    hasChanges,
    isValid,
    isSaving,
    justSaved,
    handleSave,
    handleReset,
  };
}