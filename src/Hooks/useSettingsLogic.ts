import { useState, useEffect, useMemo } from "react";
import { AppSettings, InferenceProviderType } from "../shared/sharedTypes";
import { isValidApiKey } from "../Utils/apiKeyValidation";
import { findModel, providerDefinitions } from "../../src-tauri/resources/denoBackend/LLM/LLMChoices";

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
    
    // Check if model and provider are selected
    if (!localSettings.activeModelId || !localSettings.activeProviderId) return false;

    // Check if model exists
    const model = findModel(localSettings.activeModelId);
    if (!model) return false;

    // Get provider definition
    const providerDef = providerDefinitions[localSettings.activeProviderId as InferenceProviderType];
    if (!providerDef) return false;

    // Check if provider requires API key
    if (providerDef.requiresApiKey) {
      const providerConfig = localSettings.inferenceProviders[localSettings.activeProviderId];
      if (!providerConfig?.apiKey) return false;
      
      // Validate API key format
      if (!isValidApiKey(providerConfig.apiKey)) return false;
    }

    return true;
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