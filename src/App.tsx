import { useState } from "react";
import Header from "./components/Header";
import InputHandler from "./components/InputHandler";
import "./Main.css";
import SettingsModal from "./components/Settings/SettingsModal";
import SettingsButton from "./components/Settings/SettingsButton";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black relative">
     <SettingsButton setShowSettings={setShowSettings}/>

      <div className="w-full px-8 max-w-4xl">
        <Header />
        <InputHandler />
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
