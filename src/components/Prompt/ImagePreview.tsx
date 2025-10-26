import { X } from "lucide-react";

interface ImagePreviewProps {
  preview: string;
  onRemove: () => void;
}

export default function ImagePreview({ preview, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative inline-block">
      <img
        src={preview}
        alt="Upload preview"
        className="h-20 w-20 object-cover rounded-lg border-2 border-zinc-700/50 shadow-lg"
      />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-zinc-800/90 backdrop-blur-sm rounded-full p-1 border border-zinc-600/50 hover:bg-zinc-700 transition-all hover:scale-110 shadow-lg hover:cursor-pointer"
      >
        <X size={14} className="text-white" />
      </button>
    </div>
  );
}