import { useState } from "react";
import { ArrowUpCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export default function TextInput() {
  const [text, setText] = useState("");

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && text) {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setText("");
    try {
      let res = await invoke<string>("gemma_tool_calling", { prompt: text });
      console.log(res);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="relative w-full max-w-3xl">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask me to do anything on your PC..."
        onKeyDown={(e) => handleEnter(e)}
        className="w-full px-6 py-4 pr-14 bg-zinc-900 border-2 font-Inter border-zinc-600 rounded-xl text-white text-lg placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-700 transition-all"
      />
      <button
        disabled={!text}
        onClick={handleSubmit}
        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all ${
          text
            ? "text-white hover:cursor-pointer hover:scale-110"
            : "text-zinc-700 cursor-not-allowed"
        }`}
      >
        <ArrowUpCircle size={32} />
      </button>
    </div>
  );
}
