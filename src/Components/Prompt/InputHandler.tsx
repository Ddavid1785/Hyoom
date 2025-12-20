import { useEffect, RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import ImagePreview from "./ImagePreview";
import { ImageData, Prompt, Tab, VoiceStatus } from "../../types";
import { AppSettings, Model } from "../../shared/sharedTypes";
import VoiceInputOverlay from "./VoiceOverlay";
import InputToolbar from "./InputToolbar";
import { useToast } from "../../Context/ToastContext";

interface InputHandlerProps {
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
  setMemoryModal: (isOpen: boolean) => void;
  onClearContext: () => Promise<void>;
  isAIProcessing: boolean;
  handleTabChange: (newTab: Tab) => void;
  allModels: Model[]
}

export default function InputHandler({
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
  setMemoryModal,
  onClearContext,
  isAIProcessing,
  handleTabChange,
  allModels
}: InputHandlerProps) {

  const { addToast } = useToast();

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
    if (isAIProcessing) return;

    if (voiceTranscript && voiceTranscript.trim().length > 0) {
      if (voiceTranscript.includes("[BLANK_AUDIO]")) {
        addToast("Received blank audio token, ignoring.", "warning");
        onClearTranscript();
        return;
      }

      const prompt: Prompt = { text: voiceTranscript, baseImages: null };
      onSendMessage(prompt);
      onClearTranscript();
    }
  }, [voiceTranscript, onClearTranscript, isAIProcessing, onSendMessage]);

  function handleSubmit() {
    if (isAIProcessing) return;

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
        {!isAIProcessing && (
          <VoiceInputOverlay
            isListening={isListening}
            voiceStatus={voiceStatus}
          />
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
          placeholder={
            isAIProcessing
              ? "Waiting for response..."
              : "Ask me to do anything on your PC..."
          }
          onKeyDown={handleKeyDown}
          onPaste={handlePasteImage}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-6 py-4 bg-transparent font-Inter text-white text-lg placeholder-zinc-400 focus:outline-none resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          style={{ minHeight: "60px", maxHeight: "300px" }}
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

        <InputToolbar
          hasImages={hasImages}
          openFilePicker={openFilePicker}
          isListening={isListening}
          onVoiceTrigger={onVoiceTrigger}
          setMemoryModal={setMemoryModal}
          onClearContext={onClearContext}
          savedSettings={savedSettings}
          loading={loading}
          saveSettings={saveSettings}
          text={text}
          handleSubmit={handleSubmit}
          isAIProcessing={isAIProcessing}
          handleTabChange={handleTabChange}
          allModels={allModels}
        />
      </div>
    </div>
  );
}
