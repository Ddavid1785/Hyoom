import { useRef, useEffect, useState } from "react";
import { MessageSquare, Zap } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useImageUpload } from "../../Hooks/useImageUpload";
import ChatView from "../Prompt/ChatView";
import QuickModeContext from "../Prompt/QuickModeContext";
import { Message, Prompt, VoiceStatus } from "../../types";
import { AppSettings } from "../../shared/sharedTypes";
import MemoryModal from "../Modals/MemoryModal";
import InputHandler from "../Prompt/InputHandler.tsx";

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
  partialTranscript: string;
  clearMessages: () => Promise<void>;
}

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
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
  partialTranscript,
  clearMessages,
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

  useEffect(() => {
    if (chatMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMode, messages, thinkingText]);

  useEffect(() => {
    if (!chatMode) {
      quickModeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMode, messages, thinkingText]);

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
        <div className="flex items-center justify-center mb-6 shrink-0 z-20">
          <div className="relative inline-flex items-center bg-zinc-900/40 backdrop-blur-xl rounded-full p-1 border border-zinc-800/50">
            <motion.div
              className="absolute bg-blue-600 rounded-full shadow-lg shadow-blue-600/30"
              layout
              animate={{
                x: chatMode ? "100%" : "0%",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              style={{
                width: "calc(50% - 4px)",
                height: "calc(100% - 8px)",
                top: "4px",
                left: "4px",
              }}
            />
            <button
              onClick={onToggleChatMode}
              className={`
                relative z-10 flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium
                transition-colors duration-200 hover:cursor-pointer
                ${
                  !chatMode ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }
              `}
            >
              <Zap size={16} />
              Quick
            </button>
            <button
              onClick={onToggleChatMode}
              className={`
                relative z-10 flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium
                transition-colors duration-200 hover:cursor-pointer
                ${chatMode ? "text-white" : "text-zinc-400 hover:text-zinc-200"}
              `}
            >
              <MessageSquare size={16} />
              Chat
            </button>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {chatMode ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div
                  className="flex-1 overflow-y-auto mb-6 pr-2 
                  scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800/50 
                  hover:scrollbar-thumb-zinc-700/70 [&::-webkit-scrollbar]:w-2 
                  [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                  <ChatView messages={messages} thinkingText={thinkingText} />
                  <div ref={messagesEndRef} />
                </div>
                <div className="shrink-0">
                  <InputHandler
                    onSendMessage={onSendMessage}
                    text={text}
                    setText={setText}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    textareaRef={textareaRef}
                    images={images}
                    hasImages={hasImages}
                    isDragging={isDragging}
                    fileInputRef={fileInputRef}
                    handleImageChange={handleImageChange}
                    handlePasteImage={handlePasteImage}
                    removeImage={removeImage}
                    clearImages={clearImages}
                    openFilePicker={openFilePicker}
                    getBase64Array={getBase64Array}
                    voiceStatus={voiceStatus}
                    isListening={isListening}
                    onVoiceTrigger={triggerListening}
                    voiceTranscript={lastTranscript}
                    onClearTranscript={clearTranscript}
                    savedSettings={settings}
                    saveSettings={saveSettings}
                    loading={settingsLoading}
                    partialTranscript={partialTranscript}
                    setMemoryModal={(isOpen: boolean) =>
                      setIsMemoryOpen(isOpen)
                    }
                    onClearContext={clearMessages}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="quick"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center w-full h-full relative"
              >
                <div className="flex-1 w-full flex flex-col justify-end min-h-0 overflow-hidden custom-scrollbar">
                  <div
                    className="w-full overflow-y-auto px-4 
                        scrollbar-thin scrollbar-thumb-zinc-800/30 hover:scrollbar-thumb-zinc-700/50"
                  >
                    <div className="min-h-5 mt-auto" />

                    <div className="pb-6">
                      <QuickModeContext
                        messages={messages}
                        thinkingText={thinkingText}
                      />
                      <div ref={quickModeEndRef} />
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-3xl shrink-0 z-10 px-4">
                  <InputHandler
                    onSendMessage={onSendMessage}
                    text={text}
                    setText={setText}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    textareaRef={textareaRef}
                    images={images}
                    hasImages={hasImages}
                    isDragging={isDragging}
                    fileInputRef={fileInputRef}
                    handleImageChange={handleImageChange}
                    handlePasteImage={handlePasteImage}
                    removeImage={removeImage}
                    clearImages={clearImages}
                    openFilePicker={openFilePicker}
                    getBase64Array={getBase64Array}
                    voiceStatus={voiceStatus}
                    isListening={isListening}
                    onVoiceTrigger={triggerListening}
                    voiceTranscript={lastTranscript}
                    onClearTranscript={clearTranscript}
                    savedSettings={settings}
                    saveSettings={saveSettings}
                    loading={settingsLoading}
                    partialTranscript={partialTranscript}
                    setMemoryModal={(isOpen: boolean) =>
                      setIsMemoryOpen(isOpen)
                    }
                    onClearContext={clearMessages}
                  />
                </div>
                <div className="h-[25vh] shrink-0 w-full transition-all duration-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
