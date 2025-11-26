import { useState, useEffect, useCallback } from "react"; // Add useCallback
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export type VoiceStatus = "idle" | "listening" | "processing" | "error";

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");

  const triggerListening = useCallback(async () => {
    try {
      await invoke("trigger_voice_listening");
    } catch (e) {
      console.error("Failed to trigger voice:", e);
    }
  }, []);

  // ✅ New function to wipe the text after we use it
  const clearTranscript = useCallback(() => {
    setLastTranscript("");
  }, []);

  useEffect(() => {
    const unlistenStatus = listen<string>("voice-status", (event) => {
      const newStatus = event.payload as VoiceStatus;
      setStatus(newStatus);
      if (newStatus === "processing") {
        setTimeout(() => setStatus("idle"), 2500);
      }
    });

    const unlistenData = listen<string>("voice-data", (event) => {
      // Only update if it's actually new text to prevent phantom triggers
      if (event.payload) {
        setLastTranscript(event.payload);
      }
    });

    return () => {
      unlistenStatus.then((f) => f());
      unlistenData.then((f) => f());
    };
  }, []);

  return {
    status,
    isListening: status === "listening",
    isProcessing: status === "processing",
    lastTranscript,
    triggerListening,
    clearTranscript, // Export this
  };
}