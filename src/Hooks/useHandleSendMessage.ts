import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Message, Prompt, TaskResponse } from "../types";

export function useHandleSendMessage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = async (prompt: Prompt) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt.text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const responseStr = await invoke<string>("ai_tool_calling", { prompt });
      const response: TaskResponse = JSON.parse(responseStr);

      console.log("Parsed response:", response);

      let content = "";

      response.groups.forEach((group, groupIndex) => {
        if (response.groups.length > 1) {
          content += `\n### Group ${groupIndex + 1} (${group.mode})\n\n`;
        }

        if (group.userMessage) {
          content += `${group.userMessage}\n\n`;
        }

        if (group.toolResults?.length) {
          group.toolResults.forEach((tool, index) => {
            const icon = tool.success ? "✅" : "❌";
            content += `**${index + 1}. ${icon} ${tool.toolName}**\n`;

            if (
              tool.success &&
              tool.result &&
              tool.toolName !== "respond_to_user"
            ) {
              const displayResult =
                tool.result.length > 200
                  ? tool.result.substring(0, 200) + "..."
                  : tool.result;
              content += `\`\`\`\n${displayResult}\n\`\`\`\n`;
            }

            if (!tool.success && tool.error) {
              content += `*Error: ${tool.error}*\n`;
            }
          });
        }

        if (groupIndex < response.groups.length - 1) {
          content += "---\n";
        }
      });

      if (!content.trim()) {
        content = "Task completed successfully. No response generated.";
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg].slice(-20));
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg].slice(-20));
    }
  };

  return { messages, setMessages, handleSendMessage };
}
