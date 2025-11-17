import { useState } from "react";
import { Message, Prompt } from "../types.ts";

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

const history = [...messages, userMsg].slice(-MAX_MESSAGES);

  setMessages(history);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.text,
          images: prompt.baseImages,
          history: history
        })
      });

      const data = await response.json();
      console.log("I got response", data)
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