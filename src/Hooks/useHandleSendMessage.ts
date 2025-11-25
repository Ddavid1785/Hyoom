import { useState } from "react";
import { Message, Prompt } from "../types.ts";
import { fetch } from '@tauri-apps/plugin-http';
import { LLMMessage } from "../shared/sharedTypes.ts";

function stripForLLM(msg: Message):LLMMessage {
  return {
    role: msg.role,
    content: msg.content,
    images: msg.images ?? undefined
  };
}

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const handleSendMessage = async (prompt: Prompt) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.text,
      images: prompt.baseImages ?? undefined,
      timestamp: new Date(),
    };

    const MAX_MESSAGES = 20;

    setMessages(prev => {
      const next = [...prev, userMsg];
      return next.slice(-MAX_MESSAGES);
    });

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message:stripForLLM(userMsg) })
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));

    } catch (error) {
      console.error("Error:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg].slice(-MAX_MESSAGES));
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, setMessages, handleSendMessage, clearMessages };
}