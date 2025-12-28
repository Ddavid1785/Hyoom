import { useCallback, useState } from "react";
import { Message } from "../types";
import { exportChat } from "../Utils/exportChat";

export function useChatExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (messages: Message[]) => {
    if (!messages.length || isExporting) return;

    setIsExporting(true);
    try {
      await exportChat(messages);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return {
    exportChat: handleExport,
    isExporting,
  };
}
