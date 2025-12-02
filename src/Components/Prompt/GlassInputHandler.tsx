import { useEffect, RefObject } from "react";
import { ArrowUpCircle, Image, Mic } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { ImageData, Prompt, VoiceStatus } from "../../types";
import {
  llmChoices,
  providerIcons,
} from "../../../src-tauri/resources/denoBackend/LLM/LLMChoices";
import LLMSelect from "../Settings/LLMSelectDropdown";
import { AppSettings } from "../../shared/sharedTypes";
import VoiceVisualizer from "../AppUi/VoiceVisualizer";
import { AnimatePresence, motion } from "framer-motion";

interface GlassInputHandlerProps {
  onSendMessage: (prompt: Prompt) => void;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  images: ImageData[];
  hasImages: boolean;
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasteImage: (e: React.ClipboardEvent) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  openFilePicker: () => void;
  getBase64Array: () => string[] | undefined;
  voiceStatus: VoiceStatus;
  isListening: boolean;
  onVoiceTrigger: () => void;
  voiceTranscript: string;
  onClearTranscript: () => void;
  savedSettings: AppSettings | null;
  saveSettings: (s: AppSettings) => Promise<void>;
  loading: boolean;
  partialTranscript: string;
}

export default function GlassInputHandler({
  onSendMessage,
  text,
  setText,
  isFocused,
  setIsFocused,
  textareaRef,
  images,
  hasImages,
  isDragging,
  fileInputRef,
  handleImageChange,
  handlePasteImage,
  removeImage,
  clearImages,
  openFilePicker,
  getBase64Array,
  voiceStatus,
  isListening,
  onVoiceTrigger,
  voiceTranscript,
  onClearTranscript,
  savedSettings,
  saveSettings,
  loading,
  partialTranscript,
}: GlassInputHandlerProps) {
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        300
      )}px`;
    }
  }, [text, textareaRef]);

  useEffect(() => {
    if (voiceTranscript && voiceTranscript.trim().length > 0) {
      console.log("🚀 Auto-submitting voice command:", voiceTranscript);

      const prompt: Prompt = { text: voiceTranscript, baseImages: null };
      onSendMessage(prompt);

      onClearTranscript();
    }
  }, [voiceTranscript, onClearTranscript]);

  function handleSubmit() {
    const prompt: Prompt = { text: text, baseImages: getBase64Array() };
    onSendMessage(prompt);
    setText("");
    clearImages();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && text) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="relative w-full max-w-3xl">
      <AnimatePresence>
        {(isListening || voiceStatus === "processing") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center w-full overflow-hidden"
          >
            <div className="py-2">
              <VoiceVisualizer
                isListening={isListening}
                isProcessing={voiceStatus === "processing"}
              />
            </div>

            {partialTranscript && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-zinc-400 text-sm font-medium font-Inter px-4 pb-2 text-center"
              >
                {partialTranscript}...
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={`
          relative rounded-2xl overflow-visible transition-all duration-300
          bg-zinc-900/40 backdrop-blur-xl
          border border-zinc-800/50
          ${
            isFocused
              ? "shadow-[0_0_30px_rgba(37,99,235,0.3)] border-blue-500/50"
              : "shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          }
          ${
            isDragging
              ? "shadow-[0_0_40px_rgba(59,130,246,0.5)] border-blue-400 scale-[1.02]"
              : ""
          }
        `}
      >
        {images.length > 0 && (
          <div className="p-4 pb-0">
            <ImagePreview images={images} onRemove={removeImage} />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask me to do anything on your PC..."
          onKeyDown={handleKeyDown}
          onPaste={handlePasteImage}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-6 py-4 bg-transparent font-Inter text-white text-lg placeholder-zinc-400 focus:outline-none resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          style={{
            minHeight: "60px",
            maxHeight: "300px",
          }}
          rows={1}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <div className="relative">
          <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/20 overflow-visible">
            <div className="flex items-center gap-2">
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
              <button
                onClick={onVoiceTrigger}
                className={`p-2 rounded-xl transition-all hover:cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10  ${
                  isListening
                    ? "shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] border-blue-500/20"
                    : ""
                }`}
                title="Voice input"
              >
                <Mic size={20} />
              </button>
              {loading || !savedSettings ? (
                <div>Loading model</div>
              ) : (
                <LLMSelect
                  choices={llmChoices}
                  providerIcons={providerIcons}
                  selected={
                    savedSettings
                      ? llmChoices.find(
                          (choice) =>
                            choice.modelId === savedSettings.activeLlmId
                        ) || null
                      : null
                  }
                  onSelect={(value) => {
                    if (savedSettings) {
                      saveSettings({ ...savedSettings, activeLlmId: value });
                    }
                  }}
                />
              )}
            </div>
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
      </div>
    </div>
  );
}
