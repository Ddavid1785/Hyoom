import { X } from "lucide-react";

interface ImagePreviewProps {
  preview: string;
  onRemove: () => void;
}

export default function ImagePreview({ preview, onRemove }: ImagePreviewProps) {
  return (
    <div className="absolute left-14 top-3 z-10">
      <div className="relative inline-block">
        <img
          src={preview}
          alt="Upload preview"
          className="h-16 w-16 object-cover rounded-lg border-2 border-zinc-600"
        />
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-600 hover:bg-zinc-700 transition-colors"
        >
          <X size={12} className="text-white" />
        </button>
      </div>
    </div>
  );
}
