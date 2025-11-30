import { useState } from "react";
import { Message, Prompt } from "../types.ts";
import { fetch } from '@tauri-apps/plugin-http';
import { LLMMessage } from "../shared/sharedTypes.ts";
import { useToast } from "../Context/ToastContext"; // Import the hook

function stripForLLM(msg: Message): LLMMessage {
  return {
    role: msg.role,
    content: msg.content,
    images: msg.images ?? undefined
  };
}

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  
  const { addToast } = useToast();
  
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
        body: JSON.stringify({ message: stripForLLM(userMsg) })
      });

      if (!response.ok) {
        let errorMessage = "Failed to connect to AI server";
        try {
          const errData = await response.json();
          if (errData.error) errorMessage = errData.error;
        } catch (_) {
             errorMessage = `Server Error: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const update = JSON.parse(line);

            if (update.type === "status") {
              setThinkingText(update.message); 
            } 
            else if (update.type === "content") {
              const aiMsg: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: update.text,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));
            }
            else if (update.type === "error") {
              console.error("Stream error:", update.error);
              addToast(update.error, "error"); 
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }

    } catch (error: any) {
      console.error("Error:", error);
      
      addToast(error.message || "An unexpected error occurred", "error"); 

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg].slice(-MAX_MESSAGES));
    } finally {
      setThinkingText(null);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, setMessages, handleSendMessage, clearMessages, thinkingText };
}