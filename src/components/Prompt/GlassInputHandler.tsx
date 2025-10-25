import { useState, useRef, useEffect } from "react";
import { ArrowUpCircle, Image, Mic } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { useImageUpload } from "../../Hooks/useImageUpload";
import { useWebSpeech } from "../../Hooks/useWebSpeech";
import { invoke } from "@tauri-apps/api/core";
import { Prompt } from "../../types";

export default function GlassInputHandler() {
  const [text, setText] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    imageFile,
    imagePreview,
    isDragging,
    fileInputRef,
    handleImageChange,
    handlePasteImage,
    removeImage,
    clearImage,
    openFilePicker,
    getBase64,
  } = useImageUpload();

  const { isRecording, startRecording } = useWebSpeech();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        300
      )}px`;
    }
  }, [text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && text) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!text) {
      return;
    }

    const prompt: Prompt = {
      text: text,
      baseImage: getBase64(),
    };

    setText("");
    clearImage();

    let res = await invoke<string>("ai_tool_calling", { prompt: prompt });
    console.log(res);
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
          relative rounded-2xl overflow-hidden transition-all duration-300
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
        {imagePreview && (
          <div className="p-4 pb-0">
            <ImagePreview preview={imagePreview} onRemove={removeImage} />
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
          className="hidden"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/20">
          <div className="flex items-center gap-2">
            <button
              onClick={openFilePicker}
              className={`p-2 rounded-xl transition-all hover:cursor-pointer ${
                imageFile
                  ? "text-white bg-blue-600/90 backdrop-blur-sm shadow-lg shadow-blue-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title="Attach image"
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
  );
}
