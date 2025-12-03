import { ArrowUpCircle, BrainCircuit, Eraser, Image, Mic } from "lucide-react";
import { AppSettings } from "../../shared/sharedTypes";
import ContextStealthSlider from "./ContextSlider";
import {
  llmChoices,
  providerIcons,
} from "../../../src-tauri/resources/denoBackend/LLM/LLMChoices";
import LLMSelect from "../Pages/Settings/LLMSelectDropdown";

interface InputToolbarProps {
  hasImages: boolean;
  openFilePicker: () => void;
  isListening: boolean;
  onVoiceTrigger: () => void;
  setMemoryModal: (isOpen: boolean) => void;
  onClearContext: () => void;
  savedSettings: AppSettings | null;
  loading: boolean;
  saveSettings: (s: AppSettings) => Promise<void>;
  text: string;
  handleSubmit: () => void;
  isAIProcessing: boolean;
}

export default function InputToolbar({
  hasImages,
  openFilePicker,
  isListening,
  onVoiceTrigger,
  setMemoryModal,
  onClearContext,
  savedSettings,
  loading,
  saveSettings,
  text,
  handleSubmit,
  isAIProcessing,
}: InputToolbarProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/20 overflow-visible">
        {/* Left Side: Actions & Settings */}
        <div className="flex items-center gap-2">
          {/* 1. Image Upload */}
          <button
            onClick={openFilePicker}
            className={`p-2 rounded-xl transition-all hover:cursor-pointer ${
              hasImages
                ? "text-white bg-blue-600/90 backdrop-blur-sm shadow-lg shadow-blue-600/30"
                : "text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10"
            }`}
            title="Attach images"
          >
            <Image size={20} />
          </button>

          {/* 2. Voice Input */}
          <button
            onClick={onVoiceTrigger}
            className={`p-2 rounded-xl transition-all hover:cursor-pointer ${
              isListening
                ? "text-blue-300 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                : "text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10"
            }`}
            title="Voice input"
          >
            <Mic size={20} />
          </button>

          {/* 3. Memory Bank */}
          <button
            onClick={() => setMemoryModal(true)}
            className="p-2 rounded-xl transition-all hover:cursor-pointer text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            title="Memory Bank"
          >
            <BrainCircuit size={20} />
          </button>

          {/* 4. Clear Context */}
          <button
            onClick={onClearContext}
            className="p-2 rounded-xl transition-all hover:cursor-pointer text-zinc-400 hover:text-red-300 hover:bg-red-500/10"
            title="Clear Chat Context"
          >
            <Eraser size={20} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-zinc-800 mx-1" />

          {/* 5. LLM Selection & Context Slider */}
          {loading || !savedSettings ? (
            <div className="text-xs text-zinc-500 animate-pulse">
              Loading...
            </div>
          ) : (
            <div className="flex items-center">
              <LLMSelect
                choices={llmChoices}
                providerIcons={providerIcons}
                selected={
                  savedSettings
                    ? llmChoices.find(
                        (choice) => choice.modelId === savedSettings.activeLlmId
                      ) || null
                    : null
                }
                onSelect={(value) => {
                  if (savedSettings) {
                    saveSettings({ ...savedSettings, activeLlmId: value });
                  }
                }}
              />

              <ContextStealthSlider
                settings={savedSettings}
                saveSettings={saveSettings}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          disabled={!text || isAIProcessing}
          onClick={handleSubmit}
          className={`p-2.5 rounded-xl transition-all ${
            !text || isAIProcessing
              ? "text-zinc-600 cursor-not-allowed bg-transparent"
              : "text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/40 hover:scale-105 hover:cursor-pointer"
          }`}
          title="Send message"
        >
          <ArrowUpCircle size={24} />
        </button>
      </div>
    </div>
  );
}
