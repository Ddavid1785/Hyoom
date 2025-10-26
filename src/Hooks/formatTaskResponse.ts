import { TaskResponse } from "../types";

export function formatTaskResponse(response: TaskResponse): string {
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

        if (tool.success && tool.result && tool.toolName !== "respond_to_user") {
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

  return displayContent.trim();
}