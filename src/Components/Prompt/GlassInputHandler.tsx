import { useEffect, RefObject } from "react";
import { ArrowUpCircle, Image, Mic } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { ImageData, Prompt } from "../../types";
import { llmChoices, providerIcons } from "../../../src-tauri/resources/denoBackend/LLM/LLMChoices";
import LLMSelect from "../Settings/LLMSelect";
import { useAppSettings } from "../../Hooks/useAppSettings";

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
  getBase64Array: () => string[] | null;
  isRecording: boolean;
  startRecording: (callback: (transcript: string) => void) => void;
  isTop: boolean;
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
  isRecording,
  startRecording,
  isTop,
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

  const { settings: savedSettings, saveSettings, loading } = useAppSettings();

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

  function handleVoiceInput() {
    startRecording((transcript) => {
      setText((prev) => {
        return prev ? `${prev} ${transcript}` : transcript;
      });
    });
  }

  return (
    <div className="relative w-full max-w-3xl">
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
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl transition-all hover:cursor-pointer ${
                  isRecording
                    ? "text-white bg-blue-600/90 backdrop-blur-sm shadow-lg shadow-blue-600/30 animate-pulse"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
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
                    llmChoices.find(
                      (choice) => choice.name === savedSettings.llmChoice
                    ) || null
                  }
                  onSelect={(value) => {
                    saveSettings({ ...savedSettings, llmChoice: value });
                  }}
                  isTop={isTop}
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
