import { useState } from "react";
import "./Main.css";
import TabNavigation from "./components/General/TabNavigation";
import HomePage from "./components/Pages/HomePage";
import AnimatedBackground from "./components/General/AnimatedBackground";
import AppLogo from "./components/General/AppLogo";
import SettingsPage from "./components/Pages/SettingsPage";
import { useHandleSendMessage } from "./Hooks/useHandleSendMessage";
import { Tab } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chatMode, setChatMode] = useState(false);
const { messages, handleSendMessage } = useHandleSendMessage();

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative">
      <AnimatedBackground />
      <AppLogo />
      {activeTab === "chat" && (
        <HomePage
          onSendMessage={handleSendMessage}
          messages={messages}
          chatMode={chatMode}
          onToggleChatMode={() => setChatMode((prev) => !prev)}
        />
      )}
      {activeTab === "tools" && <div></div>}
      {activeTab === "settings" && <SettingsPage />}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
