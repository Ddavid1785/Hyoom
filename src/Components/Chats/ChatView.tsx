import { Bot } from "lucide-react";
import { Message } from "../../types";
import { AnimatePresence } from "framer-motion";
import ThinkingBubble from "../ChatBubbles/ThinkingBubble";
import MessageBubble from "../ChatBubbles/MessageBubble";

interface ChatViewProps {
  messages: Message[];
  thinkingText?: string | null;
}

export default function ChatView({ messages, thinkingText }: ChatViewProps) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      {messages.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <Bot size={48} className="mx-auto mb-4 text-zinc-600" />
          <p className="text-zinc-500 font-Inter text-lg">
            How can I help you today?
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}

      <AnimatePresence>
        {thinkingText && <ThinkingBubble text={thinkingText} />}
      </AnimatePresence>
    </div>
  );
}
