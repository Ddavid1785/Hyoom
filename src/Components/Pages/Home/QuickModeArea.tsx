import { motion } from "framer-motion";
import { RefObject } from "react";
import { Message } from "../../../types";
import QuickModeContext from "../../Chats/QuickModeContext";

interface QuickModeAreaProps {
  messages: Message[];
  thinkingText: string | null;
  bottomRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export default function QuickModeArea({
  messages,
  thinkingText,
  bottomRef,
  children,
}: QuickModeAreaProps) {
  return (
    <motion.div
      key="quick"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex-1 flex flex-col items-center w-full h-full relative"
    >
      <div className="flex-1 w-full flex flex-col justify-end min-h-0 overflow-hidden custom-scrollbar">
        <div className="w-full overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-zinc-800/30 hover:scrollbar-thumb-zinc-700/50">
          <div className="min-h-5 mt-auto" />
          <div className="pb-6">
            <QuickModeContext messages={messages} thinkingText={thinkingText} />
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl shrink-0 z-10 px-4">{children}</div>
      <div className="h-[25vh] shrink-0 w-full transition-all duration-300" />
    </motion.div>
  );
}