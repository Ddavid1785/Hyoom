import { invoke } from "@tauri-apps/api/core";
import { ChatMessage, ChatPrompt, Message, Prompt, TaskResponse } from "../types";
import { useState } from "react";

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  
const handleSendMessage = async (prompt: Prompt) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.text,
      displayContent: prompt.text,
      timestamp: new Date(),
    };

    const MAX_MESSAGES = 20;

    setMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES));

    try {
      const chatHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));
      
      const chatPrompt: ChatPrompt = {
        ...prompt,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
      };

      const responseStr = await invoke<string>("ai_tool_calling", { 
        prompt: chatPrompt 
      });
      const response: TaskResponse = JSON.parse(responseStr);

      let displayContent = "";

      response.groups.forEach((group, groupIndex) => {
        if (response.groups.length > 1) {
          displayContent += `\n### Group ${groupIndex + 1} (${group.mode})\n\n`;
        }

        if (group.userMessage) {
          displayContent += `${group.userMessage}\n\n`;
        }

        if (group.toolResults?.length) {
          group.toolResults.forEach((tool, index) => {
            const icon = tool.success ? "✅" : "❌";
            displayContent += `**${index + 1}. ${icon} ${tool.toolName}**\n`;

            if (
              tool.success &&
              tool.result &&
              tool.toolName !== "respond_to_user"
            ) {
              const displayResult =
                tool.result.length > 200
                  ? tool.result.substring(0, 200) + "..."
                  : tool.result;
              displayContent += `\`\`\`\n${displayResult}\n\`\`\`\n`;
            }

            if (!tool.success && tool.error) {
              displayContent += `*Error: ${tool.error}*\n`;
            }
          });
        }

        if (groupIndex < response.groups.length - 1) {
          displayContent += "---\n";
        }
      });

      if (!displayContent.trim()) {
        displayContent = "Task completed successfully. No response generated.";
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.rawAiResponse,
        displayContent: displayContent.trim(), 
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


  const clearMessages = () => {
    setMessages([]);
  };

  return { messages, setMessages, handleSendMessage, clearMessages };
}