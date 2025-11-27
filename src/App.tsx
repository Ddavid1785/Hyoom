import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./Main.css";
import AnimatedBackground from "./Components/AppUi/AnimatedBackground";
import Titlebar from "./Components/AppUi/Titlebar";
import AppLogo from "./Components/AppUi/AppLogo";
import { usePageTransition } from "./Hooks/usePageTransition";
import HomePage from "./Components/Pages/HomePage";
import TabNavigation from "./Components/AppUi/TabNavigation";
import SettingsPage from "./Components/Pages/SettingsPage";
import { useHandleSendMessage } from "./Hooks/useHandleSendMessage";

export default function App() {
  const { messages, handleSendMessage, thinkingText } = useHandleSendMessage();
  const [chatMode, setChatMode] = useState(false);
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
              messages={messages}
              onSendMessage={handleSendMessage}
              chatMode={chatMode}
              onToggleChatMode={() => setChatMode((prev) => !prev)}
              direction={direction}
              thinkingText={thinkingText}
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
