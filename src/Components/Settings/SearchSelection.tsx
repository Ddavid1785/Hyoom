import { Globe } from "lucide-react";
import SettingsInputField from "./SettingsInputField";
import { AppSettings, SearchProviderType } from "../../shared/sharedTypes";

interface SearchSectionProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export default function SearchSection({ settings, onChange }: SearchSectionProps) {
  const activeProvider = settings.activeSearchProvider;

  const updateBraveKey = (val: string) => {
    onChange({
      ...settings,
      searchKeys: {
        ...settings.searchKeys,
        brave: val,
      },
    });
  };

  const updateGoogleConfig = (field: "apiKey" | "searchEngineId", val: string) => {
    const currentGoogle = settings.searchKeys.google || {
      apiKey: "",
      searchEngineId: "",
    };
    onChange({
      ...settings,
      searchKeys: {
        ...settings.searchKeys,
        google: {
          ...currentGoogle,
          [field]: val,
        },
      },
    });
  };

  return (
    <div className="space-y-6 pt-6 border-t border-zinc-800/50">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="text-green-400" size={20} />
        <h3 className="text-lg font-medium text-white font-Inter">
          Web Search Capabilities
        </h3>
      </div>

      <div className="flex flex-col gap-2 font-Inter">
        <label className="text-sm font-medium text-zinc-400">
          Search Provider <span className="text-zinc-600 text-xs">(Required for web tools)</span>
        </label>
        <div className="flex gap-4">
          {(["brave", "google"] as SearchProviderType[]).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...settings, activeSearchProvider: p })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                activeProvider === p
                  ? "bg-blue-600/20 border-blue-500 text-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!activeProvider && (
        <p className="text-sm text-zinc-500 italic">
          Select a search provider to configure web access.
        </p>
      )}

      {activeProvider === "brave" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <SettingsInputField
            label="Brave Search API Key"
            value={settings.searchKeys.brave || ""}
            onChange={updateBraveKey}
            placeholder="BSA..."
            type="password"
            required={true}
          />
        </div>
      )}

      {activeProvider === "google" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <SettingsInputField
            label="Google Custom Search API Key"
            value={settings.searchKeys.google?.apiKey || ""}
            onChange={(v) => updateGoogleConfig("apiKey", v)}
            placeholder="AIza..."
            type="password"
            required={true}
          />
          <SettingsInputField
            label="Search Engine ID (CX)"
            value={settings.searchKeys.google?.searchEngineId || ""}
            onChange={(v) => updateGoogleConfig("searchEngineId", v)}
            placeholder="012345..."
            type="text"
            required={true}
            helpText="Requires a Programmable Search Engine configured to search the entire web."
          />
        </div>
      )}
    </div>
  );
}