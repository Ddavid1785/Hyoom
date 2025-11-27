import { Message } from "../../types";
import { AnimatePresence } from "framer-motion";
import ThinkingBubble from "./ThinkingBubble";
import MessageBubble from "./MessageBubble";

interface QuickModeContextProps {
  messages: Message[];
  thinkingText?: string | null;
}

export default function QuickModeContext({
  messages,
  thinkingText,
}: QuickModeContextProps) {
  const recentMessages = messages.slice(-2);

  if (recentMessages.length === 0 && !thinkingText) return null;

  return (
    <div className="w-full flex flex-col justify-end space-y-6">
      <AnimatePresence mode="popLayout">
        {recentMessages.map((message, index) => {
          return <MessageBubble message={message} key={`bubble ${index}`} />;
        })}

        {thinkingText && <ThinkingBubble text={thinkingText} />}
      </AnimatePresence>
    </div>
  );
}
