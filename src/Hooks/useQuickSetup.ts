import { useState } from "react";
import { AppSettings } from "../shared/sharedTypes";

export function useQuickSetup(
  saveSettings: (s: AppSettings) => Promise<void>
) {
  const [hasSeenSetup, setHasSeenSetup] = useState(() => {
    return localStorage.getItem("hyoom_setup_seen") === "true";
  });

  const markSeen = () => {
    localStorage.setItem("hyoom_setup_seen", "true");
    setHasSeenSetup(true);
  };

  const skipSetup = () => {
    markSeen();
  };

  const completeSetup = async (settings: AppSettings) => {
    await saveSettings(settings);
    markSeen();
  };

  return {
    hasSeenSetup,
    skipSetup,
    completeSetup,
  };
}
