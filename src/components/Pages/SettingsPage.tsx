import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import SettingsInputField from "../Settings/SettingsInputField";
import { useAppSettings } from "../../Hooks/useAppSettings";

interface APIConfigurationProps {
  settings: any;
  onChange: (settings: any) => void;
}

function APIConfigurationSection({ settings, onChange }: APIConfigurationProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white font-Inter mb-2">
          API Configuration
        </h2>
        <p className="text-zinc-500 text-sm font-Inter">
          Configure your API keys to enable AI features and web search
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <SettingsInputField
          label="Gemini API Key"
          value={settings.geminiApiKey}
          onChange={(value) =>
            onChange({ ...settings, geminiApiKey: value })
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
          value={settings.googleSearchApiKey}
          onChange={(value) =>
            onChange({
              ...settings,
              googleSearchApiKey: value,
            })
          }
          placeholder="Enter your Google Search API key"
          type="password"
        />

        <SettingsInputField
          label="Google Search Engine ID"
          value={settings.googleSearchEngineId}
          onChange={(value) =>
            onChange({
              ...settings,
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
    </section>
  );
}

export default function SettingsPage() {
  const { settings: savedSettings, saveSettings, loading } = useAppSettings();
  const [localSettings, setLocalSettings] = useState(savedSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (savedSettings) {
      setLocalSettings(savedSettings);
    }
  }, [savedSettings]);

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (hasChanges && justSaved) {
      setJustSaved(false);
    }
  }, [localSettings, hasChanges, justSaved]);

  if (loading || !localSettings) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-zinc-400 font-Inter">Loading settings...</div>
      </div>
    );
  }

  const handleSave = async () => {
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

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-12 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white font-Inter mb-3">
            Settings
          </h1>
          <p className="text-zinc-400 text-lg font-Inter">
            Manage your API keys and application preferences
          </p>
        </div>

        <div className="space-y-12">
          <APIConfigurationSection 
            settings={localSettings}
            onChange={setLocalSettings}
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-zinc-800/50 mt-12">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !localSettings.geminiApiKey}
            className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all font-Inter ${
              isSaving || !hasChanges || !localSettings.geminiApiKey
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
          {hasChanges && !isSaving && (
            <span className="text-zinc-500 text-sm font-Inter">
              You have unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}