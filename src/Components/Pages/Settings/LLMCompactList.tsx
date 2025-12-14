import { motion } from "framer-motion";
import { Model } from "../../../shared/sharedTypes";
import CapabilityRow from "./CapabilityRow";

interface LLMCompactListProps {
  options: Model[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function LLMCompactList({
  options,
  selectedId,
  onSelect,
}: LLMCompactListProps) {
  return (
    <motion.div
      key="compact"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-1.5"
    >
      {options.map((model) => (
        <button
          key={model.id}
          onClick={() => onSelect(model.id)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            transition-all duration-150 group
            text-white text-sm font-medium
            hover:bg-blue-600/10 hover:border-blue-500/30 hover:cursor-pointer
            border border-transparent
            ${
              selectedId === model.id
                ? "bg-blue-600/20 border-blue-500/40"
                : "bg-white/5 border-white/5"
            }
          `}
        >
          {/* Icon Box */}
          <div className="w-8 h-8 rounded-md bg-zinc-900/50 flex items-center justify-center shrink-0 border border-white/10">
            <img
              src={model.iconPath}
              alt={model.displayName}
              className="w-5 h-5 rounded-sm object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Name & Creator */}
          <div className="flex-1 text-left flex flex-col justify-center">
            <div className="text-sm font-semibold text-zinc-200 group-hover:text-white">
              {model.displayName}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              {model.creator}
            </div>
          </div>

          {/* Capabilities & Selection Dot */}
          <div className="flex items-center gap-3">
            <CapabilityRow caps={model.capabilities} />
            
            {selectedId === model.id && (
              <motion.div 
                layoutId="active-dot"
                className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" 
              />
            )}
          </div>
        </button>
      ))}
    </motion.div>
  );
}