import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../Context/ToastContext";
import { VoiceStatus } from "../types";

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState(""); 
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
    setPartialTranscript("");
  }, []);

  useEffect(() => {
    const unlistenStatus = listen<string>("voice-status", (event) => {
      const newStatus = event.payload as VoiceStatus;
      setStatus(newStatus);
      
      if (newStatus === "error") {
        addToast("Voice Assistant error", "error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });

    const unlistenData = listen<string>("voice-data", (event) => {
      if (event.payload) {
        setLastTranscript(event.payload);
        setPartialTranscript(""); 
      }
    });

       const unlistenPartial = listen<string>("voice-partial", (event) => {
       if (event.payload) {
         let cleanText = event.payload;
         cleanText = cleanText.replace(/\b(hume|whom|who|hum|human)\b/gi, "Hyoom");
         setPartialTranscript(cleanText);
       }
    });

    return () => {
      unlistenStatus.then((fn) => fn());
      unlistenData.then((fn) => fn());
      unlistenPartial.then((fn) => fn());
    };
  }, [addToast]);

  return {
    status,
    isListening: status === "listening",
    isProcessing: status === "processing",
    lastTranscript,
    partialTranscript,
    triggerListening,
    clearTranscript,
  };
}