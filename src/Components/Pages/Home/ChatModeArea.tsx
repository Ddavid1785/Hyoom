import { motion } from "framer-motion";
import { RefObject } from "react";
import ChatView from "../../Chats/ChatView";
import { Message } from "../../../types";

interface ChatModeAreaProps {
  messages: Message[];
  thinkingText: string | null;
  bottomRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export default function ChatModeArea({
  messages,
  thinkingText,
  bottomRef,
  children,
}: ChatModeAreaProps) {
  return (
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
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0">{children}</div>
    </motion.div>
  );
}