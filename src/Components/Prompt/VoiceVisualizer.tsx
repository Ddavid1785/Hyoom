import { motion } from "framer-motion";

interface VoiceVisualizerProps {
  isListening: boolean;
  isProcessing: boolean;
}

export default function VoiceVisualizer({
  isListening,
  isProcessing,
}: VoiceVisualizerProps) {
  if (!isListening && !isProcessing) return null;

  const barColors = [
    "rgba(255, 255, 255, 0.9)", // Bright White
    "rgba(34, 211, 238, 0.8)", // Cyan-400
    "rgba(59, 130, 246, 0.8)", // Blue-500
    "rgba(161, 161, 170, 0.6)", // Zinc-400
  ];

  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      {isProcessing ? (
        // === PROCESSING STATE ===
        <div className="relative w-6 h-6 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-blue-500/30 rounded-full blur-sm"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-transparent border-t-white border-r-cyan-400"
          />
        </div>
      ) : (
        // === LISTENING STATE ===
        barColors.map((color, i) => (
          <motion.div
            key={i}
            initial={{ height: 4 }}
            animate={{
              height: [6, 20, 10, 24, 6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
              repeatType: "mirror",
            }}
            className="w-1.5 rounded-full backdrop-blur-md shadow-[0_0_10px_rgba(34,211,238,0.2)]"
            style={{ backgroundColor: color }}
          />
        ))
      )}
    </div>
  );
}
