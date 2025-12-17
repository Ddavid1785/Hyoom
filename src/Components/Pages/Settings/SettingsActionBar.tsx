import { motion, AnimatePresence } from "framer-motion";
import { Save, Check, RotateCcw } from "lucide-react";

interface SettingsActionBarProps {
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasChanges: boolean;
  isValid: boolean;
  justSaved: boolean;
}

export default function SettingsActionBar({
  onSave,
  onReset,
  isSaving,
  hasChanges,
  isValid,
  justSaved,
}: SettingsActionBarProps) {
  const saveDisabled = isSaving || !hasChanges || !isValid;
  const resetDisabled = !hasChanges || isSaving;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-4 pt-8 mt-8 border-t border-zinc-800/50"
    >
      <button
        onClick={onSave}
        disabled={saveDisabled}
        className={`
          relative px-8 py-3 rounded-xl font-semibold flex items-center gap-2 
          transition-all duration-200 font-Inter overflow-hidden
          ${
            saveDisabled
              ? "bg-zinc-800/40 text-zinc-600 cursor-not-allowed border border-transparent"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-95 cursor-pointer border border-blue-400/20"
          }
        `}
      >
        <AnimatePresence mode="wait">
          {justSaved ? (
            <motion.div
              key="saved"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Check size={18} strokeWidth={3} />
              <span>Saved!</span>
            </motion.div>
          ) : (
            <motion.div
              key="save"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Save size={18} />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <button
        onClick={onReset}
        disabled={resetDisabled}
        className={`
          px-6 py-3 rounded-xl font-medium transition-all duration-200 
          font-Inter flex items-center gap-2 border
          ${
            resetDisabled
              ? "bg-transparent border-zinc-800/50 text-zinc-700 cursor-not-allowed"
              : "bg-zinc-800/30 border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-600 hover:scale-[1.02] active:scale-95 cursor-pointer"
          }
        `}
      >
        <RotateCcw 
          size={16} 
          className={`transition-transform duration-500 ${!resetDisabled && "group-hover:-rotate-180"}`} 
        />
        <span>Reset</span>
      </button>

      {hasChanges && !isValid && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-amber-500/80 font-medium ml-2"
        >
          Please complete all required fields
        </motion.p>
      )}
    </motion.div>
  );
}