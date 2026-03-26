import { Upload, Image as ImageIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  onPhotoSelected: (file: File, previewUrl: string) => void;
}

/**
 * Drag-and-drop photo upload component with file picker fallback.
 * Accepts JPG and PNG images, shows a preview after selection.
 */
const PhotoUpload = ({ onPhotoSelected }: PhotoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Handles file selection from input or drop event */
  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onPhotoSelected(file, url);
    },
    [onPhotoSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-lg mx-auto">
      {/* Drop zone area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center px-4">
          <p className="font-semibold text-foreground">
            Drop your photo here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse · JPG, PNG, WEBP, HEIC
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Sample photo hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Use a well-lit, front-facing photo for best results</span>
      </div>
    </div>
  );
};

export default PhotoUpload;
