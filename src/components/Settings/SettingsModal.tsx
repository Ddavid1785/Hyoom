import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import SettingsInputField from "./SettingsInputField";
import { useAppSettings } from "../../Hooks/useAppSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps) {
  const { settings: savedSettings, saveSettings, loading } = useAppSettings();
  const [localSettings, setLocalSettings] = useState(savedSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (savedSettings) {
      setLocalSettings(savedSettings);
    }
  }, [savedSettings, isOpen]);

  if (!isOpen || loading || !localSettings) return null;

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await saveSettings(localSettings);

      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const canClose =
    (localSettings.geminiApiKey && localSettings.geminiApiKey.trim() !== "");

  const handleClose = () => {
    if (canClose) {
      setLocalSettings(savedSettings);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {!savedSettings?.geminiApiKey ? "Welcome! Let's get you set up" : "Settings"}
            </h2>
            {!savedSettings?.geminiApiKey && (
              <p className="text-zinc-400 text-sm mt-1">
                Configure your API keys to start using the assistant
              </p>
            )}
          </div>
          {canClose && (
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg hover:cursor-pointer"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px bg-zinc-700 flex-1"></div>
              <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wide">
                API Keys
              </h3>
              <div className="h-px bg-zinc-700 flex-1"></div>
            </div>

            <SettingsInputField
              label="Gemini API Key"
              value={localSettings.geminiApiKey}
              onChange={(value) =>
                setLocalSettings({ ...localSettings, geminiApiKey: value })
              }
              placeholder="Enter your Gemini API key"
              type="password"
              required
              helpText="Get your API key from"
              helpLink={{
                text: "Google AI Studio",
                url: "https://aistudio.google.com/apikey",
              }}
            />

            <SettingsInputField
              label="Google Search API Key"
              value={localSettings.googleSearchApiKey}
              onChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  googleSearchApiKey: value,
                })
              }
              placeholder="Enter your Google Search API key"
              type="password"
            />

            <SettingsInputField
              label="Google Search Engine ID"
              value={localSettings.googleSearchEngineId}
              onChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  googleSearchEngineId: value,
                })
              }
              placeholder="Enter your Search Engine ID"
              helpText="Create a custom search engine at"
              helpLink={{
                text: "Google Programmable Search",
                url: "https://programmablesearchengine.google.com/",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <div className="flex items-center gap-2"></div>
          <div className="flex items-center gap-3">
            {localSettings.geminiApiKey && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all hover:cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                (!localSettings.geminiApiKey &&
                  (!localSettings.geminiApiKey ||
                    localSettings.geminiApiKey.trim() === ""))
              }
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:cursor-pointer ${
                isSaving ||
                (!localSettings.geminiApiKey &&
                  (!localSettings.geminiApiKey ||
                    localSettings.geminiApiKey.trim() === ""))
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
