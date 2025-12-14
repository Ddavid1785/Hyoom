import { ArrowUpCircle, BrainCircuit, Eraser, Image, Mic, Settings2, Sparkles } from "lucide-react";
import { AppSettings, InferenceProviderType } from "../../shared/sharedTypes";
import ContextStealthSlider from "./ContextSlider";
import { findModel, getModelsForProvider } from "../../../src-tauri/resources/denoBackend/LLM/LLMChoices";
import LLMSelect from "../Pages/Settings/LLMSelectDropdown";
import { Tab } from "../../types";

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
  handleTabChange: (newTab: Tab) => void;
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
  handleTabChange
}: InputToolbarProps) {

  const hasProvider = savedSettings?.activeProviderId;
  
  const availableModels = hasProvider
    ? getModelsForProvider(savedSettings.activeProviderId as InferenceProviderType)
    : [];

  const selectedModel = savedSettings && hasProvider
    ? findModel(savedSettings.activeModelId)
    : null;

  const creatorIcons: Record<string, string> = {};
  availableModels.forEach(model => {
    if (!creatorIcons[model.creator]) {
      creatorIcons[model.creator] = model.iconPath;
    }
  });

  const handleModelSelect = async (modelId: string) => {
    if (savedSettings) {
      await saveSettings({ 
        ...savedSettings, 
        activeModelId: modelId 
      });
    }
  };

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

          {/* 5. Model Selection & Context Slider */}
          {loading || !savedSettings ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 animate-pulse min-w-[180px]">
              <div className="w-4 h-4 rounded-full bg-white/10" />
              <div className="h-3 w-20 rounded bg-white/10" />
            </div>
          ) : !hasProvider ? (
            <button
              onClick={() => handleTabChange("settings")} 
              className="
                flex items-center gap-2.5 px-4 py-3 rounded-xl
                bg-amber-500/5 backdrop-blur-xl 
                border border-dashed border-amber-500/30
                hover:bg-amber-500/10 hover:border-amber-500/50 hover:border-solid
                transition-all duration-200 group
                text-amber-200/80 hover:text-amber-100 shadow-lg shadow-black/20 
                hover:cursor-pointer hover:shadow-amber-900/10
              "
            >
              <div className="p-0.5 rounded-md bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                 <Settings2 size={16} className="text-amber-400" />
              </div>
              <span className="text-sm font-medium">Configure Provider</span>
              <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300 ml-1" />
            </button>
          ) : (
            <div className="flex items-center">
              <LLMSelect
                models={availableModels}
                creatorIcons={creatorIcons}
                selected={selectedModel ?? null}
                onSelect={handleModelSelect}
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