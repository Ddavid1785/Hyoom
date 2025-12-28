import { Download } from "lucide-react";

export function ExportChatButton({
  handleExportChat,
  disabled,
}: {
  handleExportChat: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={handleExportChat}
      disabled={disabled}
      className="
              absolute right-0 top-1/2 -translate-y-1/2
              p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 
              text-zinc-400 hover:text-white hover:bg-zinc-800 
              hover:border-zinc-700 transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              cursor-pointer
            "
      title="Export chat to text file"
    >
      <Download size={20} />
    </button>
  );
}
