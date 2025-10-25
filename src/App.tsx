import { useState } from "react";
import "./Main.css";
import { Tab } from "./types";
import TabNavigation from "./components/General/TabNavigation";
import HomePage from "./components/Pages/HomePage";
import AnimatedBackground from "./components/General/AnimatedBackground";
import AppLogo from "./components/General/AppLogo";
import SettingsPage from "./components/Pages/SettingsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative">
      <AnimatedBackground />
      <AppLogo />
      {activeTab === "chat" && <HomePage />}
      {activeTab === "tools" && <div></div>}
      {activeTab === "settings" && <SettingsPage />}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
