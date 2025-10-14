import { useState } from "react";
import { ArrowUpCircle, Image } from "lucide-react";
import ImagePreview from "./ImagePreview";
import { useImageUpload } from "../Hooks/useImageUpload";

export default function InputHandler() {
  const [text, setText] = useState("");
  
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
  } = useImageUpload();

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && text) {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    console.log("Submitting:", text, imageFile);
    setText("");
    clearImage();
  }

  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative">
        {imagePreview && (
          <ImagePreview preview={imagePreview} onRemove={removeImage} />
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask me to do anything on your PC..."
          onKeyDown={handleEnter}
          onPaste={handlePasteImage}
          className={`w-full px-6 py-4 pl-14 pr-14 bg-zinc-900 border-2 rounded-xl text-white text-lg placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-700 transition-all ${
            imagePreview ? "pt-20" : ""
          } ${
            isDragging
              ? "border-blue-500 ring-2 ring-blue-700"
              : "border-zinc-600"
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={openFilePicker}
          className={`absolute left-3 transition-all ${
            imageFile ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          } hover:cursor-pointer hover:scale-110`}
          style={{ bottom: "16px" }}
        >
          <Image size={28} />
        </button>
        <button
          disabled={!text}
          onClick={handleSubmit}
          className={`absolute right-3 transition-all ${
            text
              ? "text-white hover:cursor-pointer hover:scale-110"
              : "text-zinc-700 cursor-not-allowed"
          }`}
          style={{ bottom: "14px" }}
        >
          <ArrowUpCircle size={32} />
        </button>
      </div>
    </div>
  );
}