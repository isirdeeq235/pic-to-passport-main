import { useRef, useState } from "react";
import { Upload, Check, Palette, Droplet } from "lucide-react";
import { BACKGROUND_COLORS } from "@/lib/imageProcessing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BackgroundEditorProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onCustomBackground: (url: string) => void;
  customBackgroundUrl?: string;
  previewUrl: string;
}

/**
 * Sidebar panel for choosing passport photo background.
 * Offers preset colors, manual color picker + hex input, and custom image upload.
 */
const BackgroundEditor = ({
  selectedColor,
  onColorSelect,
  onCustomBackground,
  customBackgroundUrl,
  previewUrl,
}: BackgroundEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerColor, setPickerColor] = useState(selectedColor);
  const [tempCustomUrl, setTempCustomUrl] = useState(customBackgroundUrl || "");

  const handleColorApply = () => {
    onColorSelect(pickerColor);
    // Clear custom image when picking solid color
    if (tempCustomUrl) {
      setTempCustomUrl("");
      onCustomBackground("");
    }
  };

  const handlePresetClick = (color: string) => {
    setPickerColor(color);
    onColorSelect(color);
  };

  return (
    <div className="space-y-6">
      {/* Color picker section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Background Color
        </h3>
        
        {/* Manual picker */}
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 px-2"
              onClick={handleColorApply}
              title="Apply Color"
            >
              <Droplet className="w-3 h-3 mr-1" />
              Apply
            </Button>
            <Input
              type="color"
              value={pickerColor}
              onChange={(e) => setPickerColor(e.target.value)}
              className="w-12 h-10 p-0 border-2 border-border hover:border-primary rounded-md cursor-pointer"
            />
            <Input
              type="text"
              value={pickerColor}
              onChange={(e) => {
                const hex = e.target.value.replace(/[^#a-fA-F0-9]/g, '');
                if (hex.length === 7) {
                  setPickerColor(hex);
                }
              }}
              className="w-20 h-10 text-xs font-mono uppercase flex-shrink-0"
              maxLength={7}
            />
          </div>
          <div 
            className="w-full h-20 rounded-lg border-2 border-border ring-offset-2 transition-all hover:border-primary hover:shadow-md"
            style={{ backgroundColor: pickerColor }}
          />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handlePresetClick(color.value)}
                title={color.name}
                className={`w-10 h-10 rounded-lg border-2 transition-all duration-150 hover:scale-110 ${
                  pickerColor === color.value && !tempCustomUrl
                    ? "border-primary shadow-md ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ backgroundColor: color.value }}
              >
                {pickerColor === color.value && !tempCustomUrl && (
                  <Check className={`w-4 h-4 mx-auto ${
                    color.value === "#FFFFFF" || color.value === "#DBEAFE" || color.value === "#F1F5F9"
                      ? "text-foreground"
                      : "text-primary-foreground"
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom background image */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Pattern Upload</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          disabled={false}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Pattern
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setTempCustomUrl(url);
              onCustomBackground(url);
              // Reset picker to white when uploading image
              setPickerColor("#FFFFFF");
            }
          }}
        />
        {tempCustomUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border-2 border-primary ring-1 ring-primary/20 shadow-md">
            <img src={tempCustomUrl} alt="Pattern preview" className="w-full h-20 object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundEditor;
