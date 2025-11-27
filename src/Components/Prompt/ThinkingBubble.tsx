import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export default function ThinkingBubble({ text }: { text: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex gap-4 justify-start"
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mt-1">
        <Sparkles size={16} className="text-amber-400 animate-pulse duration-1000" />
      </div>
      
      <div className="bg-zinc-900/40 border border-amber-500/20 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3">
        <Loader2 size={16} className="text-amber-400 animate-spin" />
        <span className="text-amber-200/90 text-sm font-medium font-Inter">
          {text}
        </span>
      </div>
    </motion.div>
  );
}