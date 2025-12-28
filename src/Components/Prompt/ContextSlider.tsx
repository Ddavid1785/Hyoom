import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSettings } from "../../shared/sharedTypes";

interface ContextStealthSliderProps {
  settings: AppSettings;
  saveSettings: (s: AppSettings) => Promise<void>;
}

export default function ContextStealthSlider({
  settings,
  saveSettings,
}: ContextStealthSliderProps) {
  const MIN = 10;
  const MAX = 100;

  const [localValue, setLocalValue] = useState(settings.contextLimit || 50);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (settings.contextLimit) {
      setLocalValue(settings.contextLimit);
    }
  }, [settings.contextLimit]);

  const getTier = (val: number) => {
    if (val <= 20) return "Short";
    if (val <= 60) return "Balanced";
    return "Long";
  };

  const handleCommit = () => {
    if (settings.contextLimit !== localValue) {
      saveSettings({
        ...settings,
        contextLimit: localValue,
      });
    }
  };

  const percentage = ((localValue - MIN) / (MAX - MIN)) * 100;

  return (
    <div
      className="relative flex items-center h-full ml-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full 
                       bg-zinc-900/95 backdrop-blur-md border border-zinc-700 
                       px-3 py-2 rounded-lg shadow-xl pointer-events-none min-w-[120px] z-50"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-Inter">
                Context Window
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-bold font-mono text-sm">
                  {localValue}
                </span>
                <span className="text-xs text-zinc-400 font-Inter">
                  messages
                </span>
              </div>
              <span className="text-[10px] text-purple-400 font-medium">
                  {getTier(localValue)}
              </span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <motion.span
          animate={{
            opacity: isHovered ? 1 : 0,
            width: isHovered ? "auto" : 0,
            marginRight: isHovered ? 8 : 0, 
          }}
          className="text-[14px] font-mono text-zinc-500 overflow-hidden whitespace-nowrap"
        >
          Memory
        </motion.span>

        <div className="relative w-24 h-6 flex items-center">
          <div className="absolute w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500/50"
              style={{ width: `${percentage}%` }}
              transition={{ duration: 0 }}
            />
          </div>

          <input
            type="range"
            min={MIN}
            max={MAX}
            step="2"
            value={localValue}
            onChange={(e) => setLocalValue(parseInt(e.target.value))}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />

          <motion.div
            className="absolute w-3 h-3 bg-zinc-400 rounded-full shadow pointer-events-none"
            animate={{
              left: `calc(${percentage}% - 6px)`,
              scale: isHovered ? 1.2 : 0.8,
              backgroundColor: isHovered ? "#a855f7" : "#71717a",
            }}
            transition={{ 
                left: { duration: 0 }, 
                default: { duration: 0.15 } 
            }}
          />
        </div>
      </div>
    </div>
  );
}