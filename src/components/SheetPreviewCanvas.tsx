import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { loadImage } from '@/lib/imageProcessing';

interface SheetPreviewCanvasProps {
  photoDataUrl: string;
  photoWidth: number;
  photoHeight: number;
  rows: number;
  cols: number;
  gapPx: number;
  onDownload: () => void;
}

const SheetPreviewCanvas = ({
  photoDataUrl,
  photoWidth,
  photoHeight,
  rows,
  cols,
  gapPx,
  onDownload,
}: SheetPreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !photoDataUrl) return;
      
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = await loadImage(photoDataUrl);
      const margin = 40;
      
      const gapX = (canvas.width - cols * photoWidth - (cols - 1) * gapPx) / 2;
      const gapY = (canvas.height - rows * photoHeight - (rows - 1) * gapPx) / 2;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = gapX + c * (photoWidth + gapPx);
          const y = gapY + r * (photoHeight + gapPx);
          
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
          
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 1, y - 1, photoWidth + 2, photoHeight + 2);
        }
      }
    };
    
    render();
  }, [photoDataUrl, photoWidth, photoHeight, rows, cols, gapPx]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `a4-sheet-${rows}x${cols}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1240}
          height={1754}
          className="w-[450px] h-[637px] border-2 border-gray-200 rounded-lg shadow-lg"
        />
        <p className="absolute top-2 right-2 bg-white px-2 py-1 text-xs rounded shadow">
          {rows}×{cols} | A4 (300 DPI)
        </p>
      </div>
      <Button onClick={handleDownload}>
        Download A4 Sheet
      </Button>
    </div>
  );
};

export default SheetPreviewCanvas;

