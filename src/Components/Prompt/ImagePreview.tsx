import { X } from "lucide-react";
import { ImageData } from "../../types";

interface ImagePreviewProps {
  images: ImageData[];
  onRemove: (id: string) => void;
}

export default function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image) => (
        <div key={image.id} className="relative inline-block">
          <img
            src={image.preview}
            alt="Upload preview"
            className="h-20 w-20 object-cover rounded-lg border-2 border-zinc-700/50 shadow-lg"
          />
          <button
            onClick={() => onRemove(image.id)}
            className="absolute -top-2 -right-2 bg-zinc-800/90 backdrop-blur-sm rounded-full p-1 border border-zinc-600/50 hover:bg-zinc-700 transition-all hover:scale-110 shadow-lg"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}