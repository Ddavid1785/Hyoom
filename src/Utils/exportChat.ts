import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Message } from "../types";
import { formatChatExport } from "./formatChatExport";

function getTimestampedFileName() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  return `hyoom-chat-${timestamp}.txt`;
}

async function exportViaBrowser(
  content: string,
  fileName: string
) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export async function exportChat(messages: Message[]) {
  if (!messages.length) return;

  const content = formatChatExport(messages);
  const fileName = getTimestampedFileName();

  try {
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: "Text Files", extensions: ["txt"] }],
    });

    if (!filePath) return;

    await invoke("save_chat_file", {
      path: filePath,
      content,
    });
  } catch {
    await exportViaBrowser(content, fileName);
  }
}
