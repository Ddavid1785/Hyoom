import { motion } from "framer-motion";
import { LLMChoice } from "../../../shared/sharedTypes";

interface LLMCompactListProps {
  options: LLMChoice[];
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
      className="space-y-2"
    >
      {options.map((c) => (
        <button
          key={c.modelId}
          onClick={() => onSelect(c.modelId)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-150
            text-white text-sm font-medium
            hover:bg-blue-600/20 hover:border-blue-500/30 hover:cursor-pointer
            border
            ${
              selectedId === c.modelId
                ? "bg-blue-600/20 border-blue-500/40"
                : "bg-white/5 border-white/5"
            }
          `}
        >
          <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center shrink-0">
            <img
              src={c.pathToIcon}
              alt={c.name}
              className="w-4 h-4 rounded-sm object-cover"
            />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-xs text-zinc-500">{c.provider}</div>
          </div>
          {selectedId === c.modelId && (
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>
      ))}
    </motion.div>
  );
}
