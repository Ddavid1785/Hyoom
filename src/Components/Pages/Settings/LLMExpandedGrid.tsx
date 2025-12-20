import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Model } from "../../../shared/sharedTypes";
import CapabilityRow from "./CapabilityRow";

interface LLMExpandedGridProps {
  groupedChoices: Record<string, Model[]>;
  creatorIcons: Record<string, string>;
  selectedId?: string;
  onSelect: (id: string) => void;
  // Made optional (?)
  customModels?: Model[]; 
  onRemove?: (id: string) => void; 
}

export default function LLMExpandedGrid({
  groupedChoices,
  creatorIcons,
  selectedId,
  onSelect,
  customModels,
  onRemove,
}: LLMExpandedGridProps) {
  // Safe check: if customModels is undefined, use empty array
  const customModelIds = new Set((customModels ?? []).map((m) => m.id));

  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-6 pb-2"
    >
      {Object.entries(groupedChoices).map(([creator, models]) => (
        <div key={creator}>
          <div className="flex items-center gap-2 mb-3 px-1 border-b border-white/5 pb-1">
            {creatorIcons[creator] && (
              <img
                src={creatorIcons[creator]}
                alt={creator}
                className="w-4 h-4 object-contain opacity-70"
              />
            )}
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {creator}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {models.map((model) => {
              const isCustom = customModelIds.has(model.id);

              return (
                <button
                  key={model.id}
                  onClick={() => onSelect(model.id)}
                  className={`
                    flex flex-col gap-2 p-3 rounded-xl
                    transition-all duration-200 hover:cursor-pointer
                    text-left border group relative overflow-hidden
                    ${
                      selectedId === model.id
                        ? "bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-900/20"
                        : "bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60 hover:border-white/10"
                    }
                  `}
                >
                  {/* Top Row: Icon + Name + Delete Button */}
                  <div className="flex justify-between items-start w-full gap-2">
                    
                    {/* Left side: Icon & Text */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                        <img
                          src={model.iconPath}
                          alt={model.displayName}
                          className="w-5 h-5 rounded-sm object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-sm font-semibold truncate ${
                            selectedId === model.id
                              ? "text-blue-100"
                              : "text-zinc-300"
                          }`}
                          title={model.displayName}
                        >
                          {model.displayName}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate">
                          {model.id}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Delete Button */}
                    {/* Only show if model is custom AND onRemove prop was passed */}
                    {isCustom && onRemove && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(model.id);
                        }}
                        className="
                          shrink-0 p-1.5 rounded-lg 
                          bg-red-500/10 border border-red-500/20
                          text-red-400 opacity-0 group-hover:opacity-100 
                          hover:bg-red-500/20 hover:text-red-300
                          transition-all duration-150 cursor-pointer
                        "
                        title="Delete this model"
                      >
                        <Trash2 size={14} />
                      </div>
                    )}
                  </div>

                  {/* Footer: Capabilities */}
                  <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between w-full">
                    <CapabilityRow caps={model.capabilities} />

                    {selectedId === model.id && (
                      <div className="text-[10px] font-bold text-blue-400">
                        Active
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}