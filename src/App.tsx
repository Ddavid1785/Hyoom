import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TabNavigation from "./components/General/TabNavigation";
import HomePage from "./components/Pages/HomePage";
import AnimatedBackground from "./components/General/AnimatedBackground";
import AppLogo from "./components/General/AppLogo";
import SettingsPage from "./components/Pages/SettingsPage";
import { useHandleSendMessage } from "./Hooks/useHandleSendMessage";
import { usePageTransition } from "./Hooks/usePageTransition";
import Titlebar from "./components/General/Titlebar";
import "./Main.css";

export default function App() {
  const [chatMode, setChatMode] = useState(false);
  const { messages, handleSendMessage } = useHandleSendMessage();
  const {
    activeTab,
    direction,
    handleTabChange,
    pageVariants,
    pageTransition,
  } = usePageTransition();

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      <Titlebar />
      <div className="w-full h-full pt-10 flex flex-col items-center justify-center relative">
        <AppLogo />

        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === "chat" && (
            <HomePage
              onSendMessage={handleSendMessage}
              messages={messages}
              chatMode={chatMode}
              onToggleChatMode={() => setChatMode((prev) => !prev)}
              direction={direction}
            />
          )}

          {activeTab === "tools" && (
            <motion.div
              key="tools"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  🛠️
                </motion.div>
                <h2 className="text-2xl font-bold text-white font-Inter mb-2">
                  Tools Coming Soon
                </h2>
                <p className="text-zinc-400 font-Inter">
                  Powerful tools will be available here
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full h-full"
            >
              <SettingsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
