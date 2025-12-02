import { useState, useRef, useEffect } from "react";
import { ImageData } from "../types";

export function useImageUpload() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files) {
        const imageFiles = Array.from(files).filter(file => 
          file.type.startsWith("image/")
        );
        imageFiles.forEach(file => processImageFile(file));
      }
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  function processImageFile(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage: ImageData = {
        id: crypto.randomUUID(),
        file: file,
        preview: reader.result as string,
      };
      setImages(prev => [...prev, newImage]);
    };
    reader.readAsDataURL(file);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processImageFile(file));
    }
  }

  function handlePasteImage(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
      }
    }
  }

  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id));
  }

  function clearImages() {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function getBase64Array() {
    if (images.length === 0) return undefined;
    return images.map(img => img.preview); 
  }

  return {
    images,
    hasImages: images.length > 0,
    isDragging,
    fileInputRef,
    handleImageChange,
    handlePasteImage,
    removeImage,
    clearImages,
    openFilePicker,
    getBase64Array,
  };
}