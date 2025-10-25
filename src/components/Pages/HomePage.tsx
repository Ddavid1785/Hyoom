import { useRef, useEffect } from "react";
import GlassInputHandler from "../Prompt/GlassInputHandler";
import ChatView from "../Prompt/ChatView";
import { Message, Prompt } from "../../types";

interface HomePageProps {
  messages: Message[];
  onSendMessage: (prompt: Prompt) => void;
}

export default function HomePage({ messages, onSendMessage }: HomePageProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col px-8 py-8">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <ChatView messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0">
          <GlassInputHandler onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
}