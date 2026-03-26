import { useEffect, useRef, useState, useCallback } from "react";
import { loadImage } from "@/lib/imageProcessing";

interface PassportCanvasProps {
  foregroundUrl: string;
  backgroundColor: string;
  backgroundImageUrl?: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  onOffsetChange: (x: number, y: number) => void;
  showGuides?: boolean;
}

/**
 * Main canvas component that renders the passport photo preview.
 * Supports drag-to-reposition the foreground image.
 * Shows alignment guides when enabled.
 */
const PassportCanvas = ({
  foregroundUrl,
  backgroundColor,
  backgroundImageUrl,
  width,
  height,
  offsetX,
  offsetY,
  scale,
  onOffsetChange,
  showGuides = true,
}: PassportCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  /** Display scale factor so the canvas fits nicely in the UI */
  const displayScale = Math.min(320 / width, 420 / height);
  const displayW = Math.round(width * displayScale);
  const displayH = Math.round(height * displayScale);

  /** Renders the composite image on the canvas */
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    if (backgroundImageUrl) {
      try {
        const bgImg = await loadImage(backgroundImageUrl);
        const bgScale = Math.max(width / bgImg.width, height / bgImg.height);
        const bw = bgImg.width * bgScale;
        const bh = bgImg.height * bgScale;
        ctx.drawImage(bgImg, (width - bw) / 2, (height - bh) / 2, bw, bh);
      } catch {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Foreground person
    try {
      const fgImg = await loadImage(foregroundUrl);
      const fgScale = Math.min(width / fgImg.width, height / fgImg.height) * scale;
      const fw = fgImg.width * fgScale;
      const fh = fgImg.height * fgScale;
      const fx = (width - fw) / 2 + offsetX;
      const fy = (height - fh) / 2 + offsetY;
      ctx.drawImage(fgImg, fx, fy, fw, fh);
    } catch {
      // Foreground not loaded yet
    }

    // Alignment guides
    if (showGuides) {
      ctx.strokeStyle = "rgba(37, 99, 235, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);

      // Horizontal thirds
      ctx.beginPath();
      ctx.moveTo(0, height / 3);
      ctx.lineTo(width, height / 3);
      ctx.moveTo(0, (height * 2) / 3);
      ctx.lineTo(width, (height * 2) / 3);

      // Vertical center
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Head oval guide
      ctx.strokeStyle = "rgba(37, 99, 235, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(width / 2, height * 0.38, width * 0.22, height * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [foregroundUrl, backgroundColor, backgroundImageUrl, width, height, offsetX, offsetY, scale, showGuides]);

  useEffect(() => {
    render();
  }, [render]);

  /** Drag handlers for repositioning the face */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetX,
      oy: offsetY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.x) / displayScale;
    const dy = (e.clientY - dragStart.current.y) / displayScale;
    onOffsetChange(dragStart.current.ox + dx, dragStart.current.oy + dy);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: displayW, height: displayH }}
        className={`rounded-lg border border-border shadow-sm ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <p className="text-xs text-muted-foreground">
        {width}×{height}px · Drag to reposition
      </p>
    </div>
  );
};

export default PassportCanvas;
