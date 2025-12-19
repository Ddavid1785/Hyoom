import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../Context/ToastContext";
import { VoiceStatus } from "../types";

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  
  const { addToast } = useToast();

  const triggerListening = useCallback(async () => {
    try {
      await invoke("trigger_voice_listening");
    } catch (e) {
      addToast("Failed to start voice listener", "error");
    }
  }, [addToast]);

  const clearTranscript = useCallback(() => {
    setLastTranscript("");
  }, []);

  useEffect(() => {
    const unlistenStatus = listen<string>("voice-status", (event) => {
      const newStatus = event.payload as VoiceStatus;
      setStatus(newStatus);
      
      if (newStatus === "error") {
        setTimeout(() => setStatus("idle"), 2500);
      }
    });

    const unlistenError = listen<string>("voice-error", (event) => {
      //console.error("Rust Voice Error:", event.payload);
      addToast(`Voice Error: ${event.payload}`, "error");
    });

    const unlistenData = listen<string>("voice-data", (event) => {
      if (event.payload) {
        setLastTranscript(event.payload);
      }
    });

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenData.then((fn) => fn());
       unlistenError.then((fn) => fn());
    };
  }, [addToast]);

  return {
    status,
    isListening: status === "listening",
    isTranscribing: status === "transcribing", 
    lastTranscript,
    triggerListening,
    clearTranscript,
  };
}