import { useState } from "react";
import "./Main.css";
import { Message, Prompt, Tab } from "./types";
import TabNavigation from "./components/General/TabNavigation";
import HomePage from "./components/Pages/HomePage";
import AnimatedBackground from "./components/General/AnimatedBackground";
import AppLogo from "./components/General/AppLogo";
import SettingsPage from "./components/Pages/SettingsPage";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

const [messages, setMessages] = useState<Message[]>([]);

const handleSendMessage = async (prompt: Prompt) => {
  const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: prompt.text, timestamp: new Date() };
  setMessages(prev => [...prev, userMsg]);
  
  let response = await invoke<string>("ai_tool_calling", { prompt: prompt });
  
  const aiMsg = { id: crypto.randomUUID(), role: "assistant" as const, content: response, timestamp: new Date() };
 setMessages(prev => [...prev, aiMsg]);
};

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative">
      <AnimatedBackground />
      <AppLogo />
      {activeTab === "chat" && <HomePage onSendMessage={handleSendMessage} messages={messages}/>}
      {activeTab === "tools" && <div></div>}
      {activeTab === "settings" && <SettingsPage />}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
