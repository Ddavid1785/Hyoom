import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu, ChevronDown, X, ChevronRight } from "lucide-react";
import { LLMChoice } from "../../types";

interface Props {
  choices: LLMChoice[];
  selected: LLMChoice | null;
  onSelect: (choice: string) => void;
  providerIcons?: Record<string, string>;
  maxQuickOptions?: number;
  isTop: boolean;
}

export default function LLMSelect({
  choices,
  selected,
  onSelect,
  providerIcons = {},
  maxQuickOptions = 4,
  isTop,
}: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const groupedChoices: Record<string, LLMChoice[]> = {};
  choices.forEach((c) => {
    if (!groupedChoices[c.provider]) groupedChoices[c.provider] = [];
    groupedChoices[c.provider].push(c);
  });

  const quickOptions = choices.slice(0, maxQuickOptions);
  const hasMore = choices.length > maxQuickOptions;

  return (
    <div className="relative font-Inter" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center gap-2 px-4 py-3 rounded-xl
          bg-black/20 backdrop-blur-xl border border-blue-500/20
          hover:bg-blue-600/10 hover:border-blue-500/40
          transition-all duration-200
          text-white shadow-lg shadow-black/20 hover:cursor-pointer
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
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: expanded ? "400px" : "280px",
            }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`
              absolute left-0 ${isTop ? "-top-90" : ""} mt-2 z-50
              bg-black backdrop-blur-2xl
              border border-blue-500/20 rounded-xl shadow-2xl shadow-blue-900/20
              overflow-hidden 
            `}
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
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors hover:cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-3 max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <AnimatePresence mode="wait">
                {!expanded ? (
                  <motion.div
                    key="compact"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-2"
                  >
                    {quickOptions.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          onSelect(c.name);
                          setOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-150
                          text-white text-sm font-medium
                          hover:bg-blue-600/20 hover:border-blue-500/30 hover:cursor-pointer
                          border
                          ${
                            selected?.name === c.name
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
                          <div className="text-xs text-zinc-500">
                            {c.provider}
                          </div>
                        </div>
                        {selected?.name === c.name && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-4"
                  >
                    {Object.entries(groupedChoices).map(
                      ([provider, models]) => (
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
                                key={c.name}
                                onClick={() => {
                                  onSelect(c.name);
                                  setOpen(false);
                                  setExpanded(false);
                                }}
                                className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg
                                transition-all duration-150 hover:cursor-pointer
                                text-white text-sm font-medium
                                hover:bg-blue-600/20 border
                                ${
                                  selected?.name === c.name
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
                                <span className="text-xs truncate">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
