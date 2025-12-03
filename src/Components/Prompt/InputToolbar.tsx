import { ArrowUpCircle, BrainCircuit, Eraser, Image, Mic } from "lucide-react";
import { AppSettings } from "../../shared/sharedTypes";
import ContextStealthSlider from "./ContextStealthSlider";
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
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Attach images"
          >
            <Image size={20} />
          </button>

          {/* 2. Voice Input */}
          <button
            onClick={onVoiceTrigger}
            className={`p-2 rounded-xl transition-all hover:cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10 ${
              isListening
                ? "shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] border-blue-500/20"
                : ""
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

        {/* Right Side: Submit Button */}
        <button
          disabled={!text}
          onClick={handleSubmit}
          className={`p-2.5 rounded-xl transition-all ${
            text
              ? "text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/40 hover:scale-105 hover:cursor-pointer"
              : "text-zinc-600 cursor-not-allowed"
          }`}
          title="Send message"
        >
          <ArrowUpCircle size={24} />
        </button>
      </div>
    </div>
  );
}
