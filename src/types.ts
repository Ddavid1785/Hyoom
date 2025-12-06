export type Tab = "chat" | "tools" | "settings";

export interface ImageData {
  id: string;
  preview: string;
  file: File;
}

export interface Prompt {
  text: string;
  baseImages?: string[] | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string; 
  timestamp: Date;
  images?: string[];
}

export type VoiceStatus = "idle" | "listening" | "transcribing" | "error";
