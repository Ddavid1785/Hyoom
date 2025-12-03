import { motion } from "framer-motion";
import { VoiceStatus } from "../../types";
import VoiceVisualizer from "./VoiceVisualizer";

interface VoiceInputOverlayProps {
  isListening: boolean;
  voiceStatus: VoiceStatus;
  partialTranscript: string;
}

export default function VoiceInputOverlay({
  isListening,
  voiceStatus,
  partialTranscript,
}: VoiceInputOverlayProps) {
  if (!isListening && voiceStatus !== "processing") return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col items-center justify-center w-full overflow-hidden"
    >
      <div className="py-2">
        <VoiceVisualizer
          isListening={isListening}
          isProcessing={voiceStatus === "processing"}
        />
      </div>
      {partialTranscript && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-zinc-400 text-sm font-medium font-Inter px-4 pb-2 text-center"
        >
          {partialTranscript}...
        </motion.p>
      )}
    </motion.div>
  );
}
