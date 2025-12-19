import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../shared/sharedTypes.ts";
import { useToast } from "../Context/ToastContext";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await invoke<AppSettings>("load_settings");
        setSettings(data);
      } catch (err) {
       // console.error("Failed to load settings:", err);
        addToast(`Failed to load settings: ${err}`, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await invoke("save_settings", { settings: newSettings });
      setSettings(newSettings);
      addToast("Settings saved successfully", "success");
    } catch (err) {
      //console.error("Failed to save settings:", err);
      addToast(`Could not save settings: ${err}`, "error");
    }
  };

  return { settings, setSettings, saveSettings, loading };
}