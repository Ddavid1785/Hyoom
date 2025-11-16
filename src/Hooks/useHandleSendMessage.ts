import { useState } from "react";
import { Message, Prompt } from "../types";

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const handleSendMessage = async (prompt: Prompt) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.text,
      images: prompt.baseImages || undefined,
      timestamp: new Date(),
    };

    const MAX_MESSAGES = 20;
    setMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES));

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.text,
          images: prompt.baseImages,
          history: messages.slice(-MAX_MESSAGES)
        })
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