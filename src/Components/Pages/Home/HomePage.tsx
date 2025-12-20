import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import ModeToggle from "./ModeToggle";
import ChatModeArea from "./ChatModeArea";
import QuickModeArea from "./QuickModeArea";
import { Message, Prompt, Tab, VoiceStatus } from "../../../types";
import { AppSettings } from "../../../shared/sharedTypes";
import { useImageUpload } from "../../../Hooks/useImageUpload";
import MemoryModal from "../../Modals/MemoryModal";
import InputHandler from "../../Prompt/InputHandler";
import { useCustomModels } from "../../../Hooks/useCustomModels";
import { Download } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

interface HomePageProps {
  messages: Message[];
  onSendMessage: (prompt: Prompt) => void;
  chatMode: boolean;
  onToggleChatMode: () => void;
  direction?: number;
  thinkingText: string | null;
  settings: AppSettings | null;
  saveSettings: (s: AppSettings) => Promise<void>;
  settingsLoading: boolean;
  voiceStatus: VoiceStatus;
  isListening: boolean;
  triggerListening: () => Promise<void>;
  lastTranscript: string;
  clearTranscript: () => void;
  clearMessages: () => Promise<void>;
  isAIProcessing: boolean;
  handleTabChange: (newTab: Tab) => void;
}

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.98,
  }),
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.98,
  }),
};

const pageTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export default function HomePage({
  messages,
  onSendMessage,
  chatMode,
  onToggleChatMode,
  direction = 0,
  thinkingText,
  settings,
  saveSettings,
  settingsLoading,
  voiceStatus,
  isListening,
  triggerListening,
  lastTranscript,
  clearTranscript,
  clearMessages,
  isAIProcessing,
  handleTabChange,
}: HomePageProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickModeEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const {
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
  } = useImageUpload();

  const { allModels } = useCustomModels();

  useEffect(() => {
    if (chatMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      quickModeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMode, messages, thinkingText]);

  const handleExportChat = async () => {
    if (messages.length === 0) return;

    // 1. Format the string
    const exportContent = messages
      .map((m) => {
        const role = m.role === "user" ? "User" : "Assistant";
        // Clean up content (remove JSON artifacts if any)
        let content = m.content;
        try {
          if (content.trim().startsWith("{")) {
            const parsed = JSON.parse(content);
            if (parsed.content) content = parsed.content;
            else if (parsed.metaToolCalls) content = `[Tool Call: ${JSON.stringify(parsed.metaToolCalls)}]`;
          }
        } catch (e) {}
        
        return `${role} said:\n${content}`;
      })
      .join("\n\n--------------------------------------------------\n\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `hyoom-chat-${timestamp}.txt`;

    try {
      // Try using Tauri Dialog
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: "Text Files", extensions: ["txt"] }],
      });

      if (filePath) {
        await invoke("save_chat_file", { path: filePath, content: exportContent });
        alert("Chat exported successfully!");
      }
    } catch (err) {
      // Fallback: Browser Blob download
      const blob = new Blob([exportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const inputHandlerProps = {
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
    onVoiceTrigger: triggerListening,
    voiceTranscript: lastTranscript,
    onClearTranscript: clearTranscript,
    savedSettings: settings,
    saveSettings,
    loading: settingsLoading,
    setMemoryModal: setIsMemoryOpen,
    onClearContext: clearMessages,
    isAIProcessing: isAIProcessing,
    handleTabChange: handleTabChange,
    allModels: allModels,
  };

  return (
    <motion.div
      key="chat"
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full h-full"
    >
      <div className="w-full h-full flex flex-col px-8 py-8">
        <MemoryModal
          isOpen={isMemoryOpen}
          onClose={() => setIsMemoryOpen(false)}
        />

          <div className="relative w-full max-w-3xl mx-auto flex items-center justify-center mb-6 z-10">
          
          {/* 1. Toggle Centered */}
          <ModeToggle chatMode={chatMode} onToggle={onToggleChatMode} />
          
          {/* 2. Export Button Absolutely Positioned Right */}
          <button
            onClick={handleExportChat}
            disabled={messages.length === 0}
            className="
              absolute right-0 top-1/2 -translate-y-1/2
              p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 
              text-zinc-400 hover:text-white hover:bg-zinc-800 
              hover:border-zinc-700 transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              cursor-pointer
            "
            title="Export chat to text file"
          >
            <Download size={20} />
          </button>
        </div>

        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {chatMode ? (
              <ChatModeArea
                messages={messages}
                thinkingText={thinkingText}
                bottomRef={messagesEndRef}
              >
                <InputHandler {...inputHandlerProps} />
              </ChatModeArea>
            ) : (
              <QuickModeArea
                messages={messages}
                thinkingText={thinkingText}
                bottomRef={quickModeEndRef}
              >
                <InputHandler {...inputHandlerProps} />
              </QuickModeArea>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
