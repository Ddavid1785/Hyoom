import { useState, useRef, useEffect } from "react";
import { ArrowUpCircle, Image, Mic } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { useImageUpload } from "../Hooks/useImageUpload";
import { useWebSpeech } from "../Hooks/useWebSpeech";
import { invoke } from "@tauri-apps/api/core";
import { Prompt } from "../types";

export default function InputHandler() {
  const [text, setText] = useState<string>("");
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
        className="relative bg-zinc-900 border-2 rounded-xl overflow-hidden transition-all"
        style={{
          borderColor: isDragging ? "#3b82f6" : "#52525b",
          boxShadow: isDragging ? "0 0 0 3px rgba(59, 130, 246, 0.3)" : "none",
        }}
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
          className="w-full px-6 py-4 bg-transparent font-Quicksand text-white text-lg placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
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
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={openFilePicker}
              className={`p-2 rounded-lg transition-all hover:cursor-pointer ${
                imageFile
                  ? "text-white bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Attach image"
            >
              <Image size={24} />
            </button>
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-lg transition-all hover:cursor-pointer ${
                isRecording
                  ? "text-red-500 bg-red-950 animate-pulse"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
              title="Voice input"
            >
              <Mic size={24} />
            </button>
          </div>
          <button
            disabled={!text}
            onClick={handleSubmit}
            className={`p-2 rounded-lg transition-all ${
              text
                ? "text-white hover:bg-zinc-800 hover:scale-105 hover:cursor-pointer"
                : "text-zinc-700 cursor-not-allowed"
            }`}
            title="Send message"
          >
            <ArrowUpCircle size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
