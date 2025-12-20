import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import LLMSelectTrigger from "./LLMSelectTrigger";
import LLMCompactList from "./LLMCompactList";
import LLMExpandedGrid from "./LLMExpandedGrid";
import { Model } from "../../../shared/sharedTypes";
import { useAutoFlip } from "../../../Hooks/useAutoFlip";

interface Props {
  models: Model[];
  selected: Model | null;
  onSelect: (modelId: string) => void;
  creatorIcons?: Record<string, string>;
  maxQuickOptions?: number;
  // Made optional (?)
  customModels?: Model[];
  onRemove?: (modelId: string) => void;
}

export default function LLMSelect({
  models,
  selected,
  onSelect,
  creatorIcons = {},
  maxQuickOptions = 4,
  customModels,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const position = useAutoFlip(ref, open);
  const isFlipped = position === "top";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedChoices: Record<string, Model[]> = {};
  models.forEach((model) => {
    if (!groupedChoices[model.creator]) groupedChoices[model.creator] = [];
    groupedChoices[model.creator].push(model);
  });

  const quickOptions = models.slice(0, maxQuickOptions);
  const hasMore = models.length > maxQuickOptions;

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setExpanded(false);
  };

  return (
    <div className="relative font-Inter" ref={ref}>
      <LLMSelectTrigger
        selected={selected}
        isOpen={open}
        onClick={() => setOpen((v) => !v)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: isFlipped ? 10 : -10,
              scale: 0.96,
              width: 320,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: expanded ? 500 : 320,
            }}
            exit={{
              opacity: 0,
              y: isFlipped ? 10 : -10,
              scale: 0.96,
            }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={`
              absolute left-0 z-50
              ${isFlipped ? "bottom-full mb-2" : "top-full mt-2"} 
              bg-black/90 backdrop-blur-2xl
              border border-blue-500/20 rounded-xl shadow-2xl shadow-blue-900/20
              overflow-hidden
              origin-${isFlipped ? "bottom-left" : "top-left"}
            `}
            style={{
              minWidth: "320px",
            }}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-blue-500/10">
              <span className="text-sm font-semibold text-zinc-300">
                {expanded ? "All Models" : "Quick Select"}
              </span>
              <div className="flex items-center gap-2">
                {!expanded && hasMore && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      bg-blue-600/10 border border-blue-500/30
                      hover:bg-blue-600/20 transition-all duration-150
                      text-blue-400 text-xs font-medium hover:cursor-pointer
                    "
                  >
                    <span>View All</span>
                    <ChevronRight size={14} />
                  </button>
                )}
                {expanded && (
                  <button
                    onClick={() => setExpanded(false)}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      bg-zinc-800/30 border border-zinc-700/30
                      hover:bg-zinc-800/50 transition-all duration-150
                      text-zinc-400 text-xs font-medium hover:cursor-pointer
                    "
                  >
                    <ChevronDown size={14} />
                    <span>Show Less</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <AnimatePresence mode="wait">
                {!expanded ? (
                  <LLMCompactList
                    options={quickOptions}
                    selectedId={selected?.id}
                    onSelect={handleSelect}
                  />
                ) : (
                  <LLMExpandedGrid
                    groupedChoices={groupedChoices}
                    creatorIcons={creatorIcons}
                    selectedId={selected?.id}
                    onSelect={handleSelect}
                    customModels={customModels} // Passed down (can be undefined)
                    onRemove={onRemove} // Passed down (can be undefined)
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}