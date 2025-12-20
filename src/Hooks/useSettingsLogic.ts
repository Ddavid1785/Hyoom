import { useState, useEffect, useMemo } from "react";
import { AppSettings, InferenceProviderType } from "../shared/sharedTypes";
import { isValidApiKey } from "../Utils/apiKeyValidation";
import { providerDefinitions } from "../../src-tauri/resources/denoBackend/LLM/LLMStatic";
import { useCustomModels } from "./useCustomModels";

function areSettingsEqual(
  original: AppSettings | null,
  current: AppSettings | null
): boolean {
  if (!original || !current) return original === current;

  const obj1: any = { ...original };
  const obj2: any = { ...current };

  if (obj1.contextLimit === undefined || obj1.contextLimit === null)
    obj1.contextLimit = 20;
  if (obj2.contextLimit === undefined || obj2.contextLimit === null)
    obj2.contextLimit = 20;

  const sortKeys = (o: any) => {
    if (typeof o !== "object" || o === null) return o;
    return Object.keys(o)
      .sort()
      .reduce((acc, key) => {
        acc[key] = o[key];
        return acc;
      }, {} as any);
  };

  return JSON.stringify(sortKeys(obj1)) === JSON.stringify(sortKeys(obj2));
}

export function useSettingsLogic(
  savedSettings: AppSettings | null,
  saveSettingsFn: (s: AppSettings) => Promise<void>
) {
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const customModelLogic = useCustomModels();
  const { allModels } = customModelLogic;

  useEffect(() => {
    if (savedSettings) {
      setLocalSettings(savedSettings);
    }
  }, [savedSettings]);

  const hasChanges = useMemo(() => {
    if (savedSettings && localSettings)
      return !areSettingsEqual(savedSettings, localSettings);

    return false;
  }, [localSettings, savedSettings]);

  useEffect(() => {
    if (hasChanges && justSaved) {
      setJustSaved(false);
    }
  }, [hasChanges, justSaved]);

  const isValid = useMemo(() => {
    if (!localSettings) return false;

    // Check if model and provider are selected
    if (!localSettings.activeModelId || !localSettings.activeProviderId)
      return false;

    // Check if model exists
    const model = allModels.find((m) => m.id === localSettings.activeModelId);
    if (!model) return false;

    // Get provider definition
    const providerDef =
      providerDefinitions[
        localSettings.activeProviderId as InferenceProviderType
      ];
    if (!providerDef) return false;

    // Check if provider requires API key
    if (providerDef.requiresApiKey) {
      const providerConfig =
        localSettings.inferenceProviders[localSettings.activeProviderId];
      if (!providerConfig?.apiKey) return false;

      // Validate API key format
      if (!isValidApiKey(providerConfig.apiKey)) return false;
    }

    return true;
  }, [localSettings, allModels]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await saveSettingsFn(localSettings);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      //console.error("Failed to save settings:", error);
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
    customModelLogic,
  };
}
