import { motion } from "framer-motion";
import { Save, Check, X } from "lucide-react";

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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-4 pt-6 mt-8"
    >
      <button
        onClick={onSave}
        disabled={isSaving || !hasChanges || !isValid}
        className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all font-Inter ${
          isSaving || !hasChanges || !isValid
            ? "bg-zinc-800/40 text-zinc-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-105 hover:cursor-pointer active:scale-95"
        }`}
      >
        {justSaved ? (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <Check size={18} />
            <span>Saved!</span>
          </motion.div>
        ) : (
          <>
            <Save size={18} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </>
        )}
      </button>

      <button
        onClick={onReset}
        disabled={!hasChanges || isSaving}
        className={`px-6 py-3 rounded-xl font-medium transition-all font-Inter flex items-center gap-2 hover:cursor-pointer active:scale-95 ${
          !hasChanges || isSaving
            ? "bg-zinc-900/40 text-zinc-600 cursor-not-allowed"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white shadow-md hover:scale-105"
        }`}
      >
        <X size={18} />
        Reset
      </button>
    </motion.div>
  );
}