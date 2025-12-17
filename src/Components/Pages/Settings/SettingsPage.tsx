import { useState } from "react";
import { AppSettings } from "../../../shared/sharedTypes.ts";
import { motion, type Transition, type Variants } from "framer-motion";

import LLMSection from "../Settings/LLMSelection.tsx";
import SearchSection from "../Settings/SearchSelection.tsx";
import ContextMemorySection from "../Settings/ContextMemorySection.tsx";
import MemoryBankSection from "../Settings/MemoryBankSection.tsx";
import MemoryModal from "../../Modals/MemoryModal.tsx";

import SettingsActionBar from "../Settings/SettingsActionBar.tsx";
import { useSettingsLogic } from "../../../Hooks/useSettingsLogic.ts";

interface SettingsPageProps {
  savedSettings: AppSettings | null;
  saveSettings: (s: AppSettings) => Promise<void>;
  loading: boolean;
  direction?: number;
}

const pageVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.98,
  }),
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.98,
  }),
};

const pageTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export default function SettingsPage({
  savedSettings,
  saveSettings,
  loading,
  direction = 0,
}: SettingsPageProps) {
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const {
    localSettings,
    setLocalSettings,
    hasChanges,
    isValid,
    isSaving,
    justSaved,
    handleSave,
    handleReset,
  } = useSettingsLogic(savedSettings, saveSettings);

  return (
    <motion.div
      key="settings"
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full h-full overflow-y-auto custom-scrollbar"
    >
      {loading || !localSettings ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-zinc-400 font-Inter animate-pulse">
            Loading settings...
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <MemoryModal
            isOpen={isMemoryOpen}
            onClose={() => setIsMemoryOpen(false)}
          />

          <div className="mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white font-Inter mb-3"
            >
              Settings
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg font-Inter"
            >
              Manage your API keys and application preferences
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            <div className="space-y-8 flex flex-col">
              <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-xl flex-1">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-Inter">
                  External Intelligence
                </h2>
                <LLMSection
                  settings={localSettings}
                  onChange={setLocalSettings}
                />
                <SearchSection
                  settings={localSettings}
                  onChange={setLocalSettings}
                />
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-xl flex-1 h-full">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 font-Inter">
                  Internal Memory
                </h2>
                <ContextMemorySection
                  settings={localSettings}
                  onChange={setLocalSettings}
                />
                <MemoryBankSection onOpen={() => setIsMemoryOpen(true)} />
              </div>
            </div>

            <div className="xl:col-span-2">
              <SettingsActionBar
                onSave={handleSave}
                onReset={handleReset}
                isSaving={isSaving}
                hasChanges={hasChanges}
                isValid={isValid}
                justSaved={justSaved}
              />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
