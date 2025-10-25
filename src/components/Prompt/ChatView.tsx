import { User, Bot } from "lucide-react";
import { Message } from "../../types";

interface ChatViewProps {
  messages: Message[];
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
          <Bot size={18} className="text-blue-400" />
        </div>
      )}
      
      <div
        className={`
          max-w-[70%] px-4 py-3 rounded-2xl font-Inter
          ${isUser 
            ? "bg-blue-600 text-white" 
            : "bg-zinc-800/40 backdrop-blur-sm text-white border border-zinc-700/50"
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.displayContent || message.content}</p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center">
          <User size={18} className="text-zinc-300" />
        </div>
      )}
    </div>
  );
}

export default function ChatView({ messages }: ChatViewProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 font-Inter">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
    </div>
  );
}