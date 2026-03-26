import { Download, Printer, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportPanelProps {
  onDownloadSingle: () => void;
  onDownloadSheet4: () => void;
  onDownloadSheet6: () => void;
  onDownloadCustomSheet: (rows: number, cols: number, gap: number, topMargin: number, bottomMargin: number, leftMargin: number, rightMargin: number, pageBorderWidth: number, pageBorderColor: string) => void;
  onPreviewSheet: (rows: number, cols: number, gap: number, topMargin: number, bottomMargin, leftMargin: number, rightMargin: number, pageBorderWidth: number, pageBorderColor: string) => Promise<string>;
  isExporting: boolean;
}



const ExportPanel = ({
  onDownloadSingle,
  onDownloadSheet4,
  onDownloadSheet6,
  onDownloadCustomSheet,
  onPreviewSheet,
  isExporting,
}: ExportPanelProps) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [gap, setGap] = useState(10);
  const [topMargin, setTopMargin] = useState(150);
  const [bottomMargin, setBottomMargin] = useState(150);
  const [leftMargin, setLeftMargin] = useState(150);
  const [rightMargin, setRightMargin] = useState(150);
  const [pageBorderWidth, setPageBorderWidth] = useState(8);
  const [pageBorderColor, setPageBorderColor] = useState("#CBD5E1");

  const [open, setOpen] = useState(false);


  const handlePreviewCustom = async () => {
    setIsPreviewing(true);
    try {
      const url = await onPreviewSheet(rows, cols, gap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor);
      setPreviewUrl(url);
      setOpen(true);
    } catch {
      alert("Preview generation failed. Please try again.");
    } finally {
      setIsPreviewing(false);
    }
  };


  const handleDownloadFromPreview = () => {
    if (previewUrl) {
      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = `passport-sheet-${rows}x${cols}-gap${gap}px.png`;
      link.click();
    }
    setOpen(false);
  };


  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Export</h3>

      {/* Single photo */}
      <Button
        onClick={onDownloadSingle}
        disabled={isExporting}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Photo
      </Button>

      {/* Preset sheets */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Preset Sheets (A4)</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadSheet4}
          disabled={isExporting}
          className="w-full"
        >
          <Printer className="w-4 h-4 mr-2" />
          4 Photos (2×2)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadSheet6}
          disabled={isExporting}
          className="w-full"
        >
          <Printer className="w-4 h-4 mr-2" />
          6 Photos (2×3)
        </Button>
      </div>

      {/* Custom grid */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <Label className="text-xs font-medium text-foreground">Custom Grid (A4)</Label>

        {/* Rows & Cols */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground block mb-1">Rows</Label>
            <Input 
              type="number" 
              min="1" 
              max="10" 
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 2))}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground block mb-1">Cols</Label>
            <Input 
              type="number" 
              min="1" 
              max="10" 
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 2))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Margins T B L R */}
        <div className="grid grid-cols-4 gap-1 text-xs mb-2">
          <div className="space-y-[1px]">
            <Label className="text-[10px] text-muted-foreground">T</Label>
            <Input 
              type="number" 
              min="10" 
              max="300" 
              value={topMargin}
              onChange={(e) => setTopMargin(Math.max(10, parseInt(e.target.value) || 150))}
              className="h-6 text-xs"
            />
          </div>
          <div className="space-y-[1px]">
            <Label className="text-[10px] text-muted-foreground">B</Label>
            <Input 
              type="number" 
              min="10" 
              max="300" 
              value={bottomMargin}
              onChange={(e) => setBottomMargin(Math.max(10, parseInt(e.target.value) || 150))}
              className="h-6 text-xs"
            />
          </div>
          <div className="space-y-[1px]">
            <Label className="text-[10px] text-muted-foreground">L</Label>
            <Input 
              type="number" 
              min="10" 
              max="300" 
              value={leftMargin}
              onChange={(e) => setLeftMargin(Math.max(10, parseInt(e.target.value) || 150))}
              className="h-6 text-xs"
            />
          </div>
          <div className="space-y-[1px]">
            <Label className="text-[10px] text-muted-foreground">R</Label>
            <Input 
              type="number" 
              min="10" 
              max="300" 
              value={rightMargin}
              onChange={(e) => setRightMargin(Math.max(10, parseInt(e.target.value) || 150))}
              className="h-6 text-xs"
            />
          </div>
        </div>

        {/* Gap, Border, Color */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground block mb-1">Gap & Page Border</Label>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="space-y-[1px]">
              <Label className="text-[10px] text-muted-foreground">Gap</Label>
              <Input 
                type="number" 
                min="0" 
                max="50" 
                value={gap}
                onChange={(e) => setGap(Math.max(0, parseInt(e.target.value) || 10))}
                className="h-6 text-xs"
              />
            </div>
            <div className="space-y-[1px]">
              <Label className="text-[10px] text-muted-foreground">Border</Label>
              <Input 
                type="number" 
                min="2" 
                max="20" 
                value={pageBorderWidth}
                onChange={(e) => setPageBorderWidth(Math.max(2, parseInt(e.target.value) || 8))}
                className="h-6 text-xs"
              />
            </div>
            <div className="space-y-[1px]">
              <Label className="text-[10px] text-muted-foreground">Color</Label>
              <Input 
                type="color" 
                value={pageBorderColor}
                onChange={(e) => setPageBorderColor(e.target.value)}
                className="h-6"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Margins: T{topMargin} B{bottomMargin} L{leftMargin} R{rightMargin} | Gap: {gap}px | Border: {pageBorderWidth}px
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewCustom}
          disabled={isPreviewing || isExporting || rows * cols > 20}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewing ? "Generating..." : "Preview Sheet"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownloadCustomSheet(rows, cols, gap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor)}
          disabled={isExporting || rows * cols > 20 || rows < 1 || cols < 1}
          className="w-full"
        >
          <Printer className="w-4 h-4 mr-2" />
          Download Sheet ({rows}×{cols})
        </Button>

        {rows * cols > 20 && (
          <p className="text-xs text-destructive">Max 20 photos recommended for quality</p>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>A4 Print Sheet Preview ({rows}×{cols})</DialogTitle>
            <DialogDescription className="text-xs">
              300 DPI PNG - Ready to print. Check layout before download.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 max-w-full max-h-[60vh] flex items-center justify-center bg-muted/50">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="A4 Sheet Preview"
                className="max-w-full max-h-full border shadow-xl rounded-lg cursor-pointer hover:shadow-2xl transition-all"
                style={{ maxHeight: '70vh', maxWidth: '100%' }}
              />
            ) : (
              <div className="text-muted-foreground text-sm">No preview</div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 border-t gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadFromPreview}>
              <Download className="w-4 h-4 mr-2" />
              Download Full Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportPanel;

