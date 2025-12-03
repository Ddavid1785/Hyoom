import { motion } from "framer-motion";
import { LLMChoice } from "../../../shared/sharedTypes";

interface LLMExpandedGridProps {
  groupedChoices: Record<string, LLMChoice[]>;
  providerIcons: Record<string, string>;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function LLMExpandedGrid({
  groupedChoices,
  providerIcons,
  selectedId,
  onSelect,
}: LLMExpandedGridProps) {
  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-4"
    >
      {Object.entries(groupedChoices).map(([provider, models]) => (
        <div key={provider}>
          <div className="flex items-center gap-2 mb-2 px-1">
            {providerIcons[provider] && (
              <img
                src={providerIcons[provider]}
                alt={provider}
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {provider}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {models.map((c) => (
              <button
                key={c.modelId}
                onClick={() => onSelect(c.modelId)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  transition-all duration-150 hover:cursor-pointer
                  text-white text-sm font-medium
                  hover:bg-blue-600/20 border
                  ${
                    selectedId === c.modelId
                      ? "bg-blue-600/20 border-blue-500/40"
                      : "bg-white/5 border-white/5"
                  }
                `}
              >
                <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                  <img
                    src={c.pathToIcon}
                    alt={c.name}
                    className="w-4 h-4 rounded-sm object-cover"
                  />
                </div>
                <span className="text-xs truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
