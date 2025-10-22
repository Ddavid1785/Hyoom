import { Settings } from "lucide-react";

export default function SettingsButton({
  setShowSettings,
}: {
  setShowSettings: (show: boolean) => void;
}) {
  return (
    <button
      onClick={() => setShowSettings(true)}
      className="absolute top-6 right-6 p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all hover:cursor-pointer"
      title="Settings"
    >
      <Settings size={24} />
    </button>
  );
}
