import { motion } from "framer-motion";
import { MessageSquare, Zap } from "lucide-react";

interface ModeToggleProps {
  chatMode: boolean;
  onToggle: () => void;
}

export default function ModeToggle({ chatMode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex items-center justify-center mb-6 shrink-0 z-20">
      <div className="relative inline-flex items-center bg-zinc-900/40 backdrop-blur-xl rounded-full p-1 border border-zinc-800/50">
        <motion.div
          className="absolute bg-blue-600 rounded-full shadow-lg shadow-blue-600/30"
          layout
          animate={{ x: chatMode ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            width: "calc(50% - 4px)",
            height: "calc(100% - 8px)",
            top: "4px",
            left: "4px",
          }}
        />
        <button
          onClick={onToggle}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium transition-colors duration-200 hover:cursor-pointer ${
            !chatMode ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Zap size={16} />
          Quick
        </button>
        <button
          onClick={onToggle}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full font-Inter text-sm font-medium transition-colors duration-200 hover:cursor-pointer ${
            chatMode ? "text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <MessageSquare size={16} />
          Chat
        </button>
      </div>
    </div>
  );
}