import { motion } from "framer-motion";
import { LLMChoice } from "../../../shared/sharedTypes";
import CapabilityRow from "./CapabilityRow";

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
      className="space-y-6 pb-2"
    >
      {Object.entries(groupedChoices).map(([provider, models]) => (
        <div key={provider}>
          <div className="flex items-center gap-2 mb-3 px-1 border-b border-white/5 pb-1">
            {providerIcons[provider] && (
              <img
                src={providerIcons[provider]}
                alt={provider}
                className="w-4 h-4 object-contain opacity-70"
              />
            )}
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {provider}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {models.map((c) => (
              <button
                key={c.modelId}
                onClick={() => onSelect(c.modelId)}
                className={`
                  flex flex-col gap-2 p-3 rounded-xl
                  transition-all duration-200 hover:cursor-pointer
                  text-left border group relative overflow-hidden
                  ${
                    selectedId === c.modelId
                      ? "bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-900/20"
                      : "bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60 hover:border-white/10"
                  }
                `}
              >
                {/* Header: Icon + Name */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                    <img
                      src={c.pathToIcon}
                      alt={c.name}
                      className="w-5 h-5 rounded-sm object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold truncate ${selectedId === c.modelId ? "text-blue-100" : "text-zinc-300"}`}>
                        {c.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate">
                        {c.modelId}
                    </span>
                  </div>
                </div>

                {/* Footer: Capabilities */}
                <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between">
                     <CapabilityRow caps={c.capabilities} />
                     
                     {selectedId === c.modelId && (
                        <div className="text-[10px] font-bold text-blue-400">Active</div>
                     )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}