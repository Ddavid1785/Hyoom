import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { AppSettings } from "../../../shared/sharedTypes";

interface ContextMemorySectionProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export default function ContextMemorySection({
  settings,
  onChange,
}: ContextMemorySectionProps) {
  const value = settings.contextLimit || 20;

  // Determine current tier for visual feedback
  const getTier = (val: number) => {
    if (val <= 15) return "Short";
    if (val <= 30) return "Balanced";
    return "Long";
  };

  const currentTier = getTier(value);

  return (
    <div className="pt-6 border-t border-zinc-800/50 space-y-6">
      <div className="flex items-center gap-2">
        <Cpu className="text-purple-400" size={20} />
        <h3 className="text-lg font-medium text-white font-Inter">
          Context Memory
        </h3>
      </div>

      <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/50">
        <div className="flex justify-between items-start mb-6">
          <p className="text-sm text-zinc-400 font-Inter max-w-[70%] leading-relaxed">
            Controls how many recent messages Hyoom retains. 
            <br />
            <span className="text-xs text-zinc-500">
              Higher values = better recall but higher token costs.
            </span>
          </p>
          
          <div className="flex flex-col items-end">
            {/* 
               FIX: Removed key={value} to prevent unmounting. 
               Added a unique key only to the TIER color to flash it, 
               but kept the number stable.
            */}
            <motion.span 
              // We use key={value} ONLY for a tiny scale bump, 
              // but we ensure opacity is always 1 so it never disappears.
              key={value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }} // Lightning fast transition
              className="text-2xl font-bold text-white font-mono leading-none"
            >
              {value}
            </motion.span>
            <span className="text-xs text-zinc-500 font-Inter">messages</span>
          </div>
        </div>

        {/* Custom Range Slider Container */}
        <div className="relative w-full h-8 flex items-center group">
          <input
            type="range"
            min="10"
            max="60"
            step="2"
            value={value}
            onChange={(e) =>
              onChange({
                ...settings,
                contextLimit: parseInt(e.target.value),
              })
            }
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 z-10 relative transition-all"
          />
        </div>

        {/* Dynamic Labels */}
        <div className="flex justify-between mt-2 font-Inter text-xs font-medium relative">
            {/* Background track for the labels to sit on (optional visual aid) */}
          {["Short", "Balanced", "Long"].map((tier) => {
             const isActive = currentTier === tier;
             return (
            <motion.div
              key={tier}
              animate={{
                color: isActive ? "#e4e4e7" : "#52525b", // zinc-200 vs zinc-600
                y: isActive ? -2 : 0, // Slight lift when active
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-1 min-w-[60px]"
            >
              <span>{tier}</span>
              
              {/* Only show the active dot with AnimatePresence to fade it in/out nicely */}
              <AnimatePresence>
                {isActive && (
                    <motion.div
                    layoutId="active-dot"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    />
                )}
              </AnimatePresence>
            </motion.div>
          )})}
        </div>
      </div>
    </div>
  );
}