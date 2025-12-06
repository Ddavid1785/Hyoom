import { motion, AnimatePresence } from "framer-motion";
import { VoiceStatus } from "../../types";
import VoiceVisualizer from "./VoiceVisualizer";

interface VoiceInputOverlayProps {
  isListening: boolean;
  voiceStatus: VoiceStatus;
}

export default function VoiceInputOverlay({
  isListening,
  voiceStatus,
}: VoiceInputOverlayProps) {
  const isActive = isListening || voiceStatus === "processing";

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full py-4"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative flex flex-col items-center px-8 py-4 overflow-hidden
                          bg-zinc-950/60 backdrop-blur-xl 
                          border border-white/10 rounded-2xl 
                          shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
              
              <div className="h-12 flex items-center justify-center w-full">
                <VoiceVisualizer
                  isListening={isListening}
                  isProcessing={voiceStatus === "processing"}
                />
              </div>

              <motion.div 
                className="flex items-center gap-2 mt-3"
                layout
              >
                <span className="relative flex h-2.5 w-2.5">
                  <motion.span 
                    animate={
                      voiceStatus === "processing" 
                        ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } 
                        : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                    }
                    transition={{ repeat: Infinity, duration: voiceStatus === "processing" ? 1 : 2 }}
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 
                      ${voiceStatus === "processing" ? "bg-purple-400" : "bg-cyan-400"}`}
                  />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 
                    ${voiceStatus === "processing" ? "bg-purple-500" : "bg-cyan-500"}`} 
                  />
                </span>

                <p className={`text-xs font-medium tracking-wide transition-colors duration-300
                  ${voiceStatus === "processing" ? "text-purple-300 drop-shadow-sm" : "text-cyan-100/80"}`}>
                  {voiceStatus === "processing" 
                    ? "Thinking..." 
                    : "Listening..."}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}