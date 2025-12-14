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
  handleTabChange
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
    } else {
      quickModeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMode, messages, thinkingText]);

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
    handleTabChange: handleTabChange
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

        <ModeToggle chatMode={chatMode} onToggle={onToggleChatMode} />

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