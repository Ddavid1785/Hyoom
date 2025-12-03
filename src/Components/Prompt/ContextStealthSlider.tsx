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
  // Local state for smooth dragging without saving every pixel
  const [localValue, setLocalValue] = useState(settings.contextLimit || 20);
  const [isHovered, setIsHovered] = useState(false);

  // Sync local state if settings change from outside (e.g. reset button)
  useEffect(() => {
    if (settings.contextLimit) {
      setLocalValue(settings.contextLimit);
    }
  }, [settings.contextLimit]);

  // Determine tier for the tooltip
  const getTier = (val: number) => {
    if (val <= 15) return "Short Recall";
    if (val <= 30) return "Balanced";
    return "Deep Memory";
  };

  const handleCommit = () => {
    // Only save when user releases the mouse/touch
    if (settings.contextLimit !== localValue) {
      saveSettings({
        ...settings,
        contextLimit: localValue,
      });
    }
  };

  return (
    <div
      className="relative flex items-center h-full ml-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Popup - Appears on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full 
                       bg-zinc-900/95 backdrop-blur-md border border-zinc-700 
                       px-3 py-2 rounded-lg shadow-xl pointer-events-none min-w-[100px] z-50"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-Inter">
                Context Window
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-bold font-mono text-sm">
                  {localValue}
                </span>
                <span className="text-xs text-purple-400 font-medium">
                  {getTier(localValue)}
                </span>
              </div>
            </div>
            {/* Little Triangle Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Track Visuals */}
      <div className="flex items-center gap-2">
        {/* Subtle label that fades in */}
        <motion.span
          animate={{
            opacity: isHovered ? 1 : 0,
            width: isHovered ? "auto" : 0,
          }}
          className="text-[12px] font-mono text-zinc-500 overflow-hidden whitespace-nowrap"
        >
          Memory
        </motion.span>

        <div className="relative w-24 h-6 flex items-center">
          {/* Custom Track Background */}
          <div className="absolute w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500/50"
              style={{ width: `${(localValue / 60) * 100}%` }}
            />
          </div>

          {/* The Actual Input */}
          <input
            type="range"
            min="10"
            max="60"
            step="2"
            value={localValue}
            onChange={(e) => setLocalValue(parseInt(e.target.value))}
            onMouseUp={handleCommit} // Save only on release (Mouse)
            onTouchEnd={handleCommit} // Save only on release (Touch)
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />

          {/* Custom Thumb (The little circle) - purely visual, follows value */}
          <motion.div
            className="absolute w-3 h-3 bg-zinc-400 rounded-full shadow pointer-events-none"
            animate={{
              left: `calc(${((localValue - 10) / (60 - 10)) * 100}% - 6px)`,
              scale: isHovered ? 1.2 : 0.8,
              backgroundColor: isHovered ? "#a855f7" : "#71717a", // purple-500 vs zinc-500
            }}
          />
        </div>
      </div>
    </div>
  );
}
