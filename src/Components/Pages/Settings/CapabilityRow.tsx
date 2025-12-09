import { Eye, Image, TerminalSquare } from "lucide-react";
import { LLMCapabilities } from "../../../shared/sharedTypes";

export default function CapabilityRow({ caps }: { caps: LLMCapabilities }) {
  if (!caps) return null;

  return (
    <div className="flex items-center gap-1.5 opacity-80">
      {caps.vision && (
        <div title="Vision Capable" className="text-purple-400">
          <Eye size={14} />
        </div>
      )}
      {caps.imageGeneration && (
        <div title="Image Generation" className="text-pink-400">
          <Image size={14} />
        </div>
      )}
      {caps.functionCalling && (
        <div title="Strong Tool Use" className="text-green-400">
          <TerminalSquare size={14} />
        </div>
      )}
    </div>
  );
}