import { Download } from "lucide-react";

interface ExportChatButtonProps {
  handleExportChat: () => void;
  disabled: boolean;
  className?: string;
}

export function ExportChatButton({
  handleExportChat,
  disabled,
  className = "",
}: ExportChatButtonProps) {
  return (
    <button
      onClick={handleExportChat}
      disabled={disabled}
      className={`
        group relative
        p-2.5 rounded-xl 
        bg-zinc-900/40 backdrop-blur-md 
        border border-zinc-800/50
        text-zinc-400 hover:text-blue-300 
        hover:bg-blue-500/10 hover:border-blue-500/30
        transition-all duration-300
        disabled:opacity-30 disabled:cursor-not-allowed
        cursor-pointer shadow-lg shadow-black/20
        ${className}
      `}
      title="Export chat to text file"
    >
      <Download
        size={20}
        className="transition-transform group-hover:-translate-y-0.5"
      />
    </button>
  );
}
