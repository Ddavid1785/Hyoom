import { useRef, useEffect } from "react";
import { MessageSquare, Zap } from "lucide-react";
import GlassInputHandler from "../Prompt/GlassInputHandler";
import ChatView from "../Prompt/ChatView";
import { Message, Prompt } from "../../types";

interface HomePageProps {
  messages: Message[];
  onSendMessage: (prompt: Prompt) => void;
  chatMode: boolean;
  onToggleChatMode: () => void;
}

export default function HomePage({ 
  messages, 
  onSendMessage, 
  chatMode, 
  onToggleChatMode 
}: HomePageProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMode]);

  return (
    <div className="w-full h-full flex flex-col px-8 py-8">
      <div className="flex items-center justify-center mb-6 flex-shrink-0">
        <div className="inline-flex items-center bg-zinc-900/40 backdrop-blur-xl rounded-full p-1 border border-zinc-800/50">
          <button
            onClick={onToggleChatMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium
              transition-all hover:cursor-pointer
              ${!chatMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <Zap size={16} />
            Quick
          </button>
          <button
            onClick={onToggleChatMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium
              transition-all hover:cursor-pointer
              ${chatMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <MessageSquare size={16} />
            Chat
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col min-h-0">
        {chatMode ? (
          <>
            <div className="flex-1 overflow-y-auto mb-6 pr-2 
              scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800/50 
              hover:scrollbar-thumb-zinc-700/70 [&::-webkit-scrollbar]:w-2 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-zinc-800/50 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              [&::-webkit-scrollbar-thumb]:border-2 
              [&::-webkit-scrollbar-thumb]:border-transparent
              hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700/70">
              <ChatView messages={messages} />
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0">
              <GlassInputHandler onSendMessage={onSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <GlassInputHandler onSendMessage={onSendMessage} />
          </div>
        )}
      </div>
    </div>
  );
}