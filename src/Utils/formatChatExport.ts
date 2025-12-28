import { Message } from "../types";

export function formatChatExport(messages: Message[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";

      let content = m.content;

      try {
        if (typeof content === "string" && content.trim().startsWith("{")) {
          const parsed = JSON.parse(content);
          if (typeof parsed?.content === "string") {
            content = parsed.content;
          } else if (parsed?.metaToolCalls) {
            content = `[Tool Call]\n${JSON.stringify(parsed.metaToolCalls, null, 2)}`;
          }
        }
      } catch {
        // ignore malformed JSON
      }

      return `${role}:\n${content}`;
    })
    .join("\n\n────────────────────────────────────────\n\n");
}