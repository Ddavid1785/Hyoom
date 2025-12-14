import { Server } from "lucide-react";
import { InferenceProviderType } from "../../../shared/sharedTypes";
import { providerDefinitions } from "../../../../src-tauri/resources/denoBackend/LLM/LLMChoices";

interface ProviderSelectProps {
  providers: InferenceProviderType[];
  selected: InferenceProviderType;
  onSelect: (provider: InferenceProviderType) => void;
}

export default function ProviderSelect({
  providers,
  selected,
  onSelect,
}: ProviderSelectProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 font-Inter">
        <Server size={16} className="text-blue-400" />
        Provider
      </label>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((providerId) => {
          const provider = providerDefinitions[providerId];
          const isSelected = selected === providerId;

          return (
            <button
              key={providerId}
              onClick={() => onSelect(providerId)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg
                transition-all duration-200 font-Inter
                border
                ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500/40 text-white"
                    : "bg-zinc-900/40 border-zinc-700/30 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-600/40"
                }
              `}
            >
              <img
                src={provider.iconPath}
                alt={provider.name}
                className="w-5 h-5 rounded-sm object-cover"
              />
              <span className="text-sm font-medium">{provider.name}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 font-Inter">
        Choose which provider to use for this model
      </p>
    </div>
  );
}
