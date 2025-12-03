import { Cpu, ChevronDown } from "lucide-react";
import { LLMChoice } from "../../../shared/sharedTypes";

interface LLMSelectTriggerProps {
  selected: LLMChoice | null;
  isOpen: boolean;
  onClick: () => void;
}

export default function LLMSelectTrigger({
  selected,
  isOpen,
  onClick,
}: LLMSelectTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 px-4 py-3 rounded-xl
        bg-black/20 backdrop-blur-xl border border-blue-500/20
        hover:bg-blue-600/10 hover:border-blue-500/40
        transition-all duration-200
        text-white shadow-lg shadow-black/20 hover:cursor-pointer
        w-full text-left
      "
    >
      {!selected && (
        <>
          <Cpu size={18} className="text-blue-400" />
          <span className="text-sm text-zinc-300">Choose Model</span>
        </>
      )}
      {selected && (
        <>
          <img
            src={selected.pathToIcon}
            alt=""
            className="w-5 h-5 rounded-sm object-cover"
          />
          <span className="text-sm font-medium">{selected.name}</span>
        </>
      )}
      <ChevronDown
        size={16}
        className={`transition-transform ml-auto text-blue-400 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
