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
          className="h-12 w-12 object-cover rounded-lg border-2 border-zinc-600"
        />
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-0.5 border border-zinc-600 hover:bg-zinc-700 transition-colors"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}