  import { invoke } from "@tauri-apps/api/core";
  import { ChatMessage, ChatPrompt, Message, Prompt, TaskResponse } from "../types";
  import { useState } from "react";
import { formatTaskResponse } from "./formatTaskResponse";

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const handleSendMessage = async (prompt: Prompt) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.text,
      displayContent: prompt.text,
      images: prompt.baseImages || undefined,
      timestamp: new Date(),
    };

    const MAX_MESSAGES = 20;
    setMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES));

    try {
      const chatHistory: ChatMessage[] = messages.map(msg => {
        const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
          { text: msg.content }
        ];
        
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(imageData => {
            parts.push({
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            });
          });
        }
        
        return {
          role: msg.role === "user" ? "user" : "model",
          parts
        };
      });
      
      const chatPrompt: ChatPrompt = {
        ...prompt,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
      };

      const responseStr = await invoke<string>("ai_tool_calling", { prompt: chatPrompt });
      const response: TaskResponse = JSON.parse(responseStr);

      const displayContent = formatTaskResponse(response);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.rawAiResponse,
        displayContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));

    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error}`,
        displayContent: `Error: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg].slice(-MAX_MESSAGES));
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, setMessages, handleSendMessage, clearMessages };
}