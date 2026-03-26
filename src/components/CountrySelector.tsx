import { 
  PASSPORT_TEMPLATES, 
  type PassportTemplate 
} from "@/lib/imageProcessing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface CountrySelectorProps {
  selected: string;
  customWidth?: number;
  customHeight?: number;
  onCustomWidthChange?: (width: number) => void;
  onCustomHeightChange?: (height: number) => void;
  onSelect: (key: string) => void;
}


/**
 * Country template selector for passport photo dimensions.
 * Each template defines the correct photo size for that country.
 */
const CountrySelector = ({ selected, customWidth, customHeight, onCustomWidthChange, onCustomHeightChange, onSelect }: CountrySelectorProps) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Country Template</h3>
      <div className="space-y-2">
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PASSPORT_TEMPLATES).map(([key, tpl]) => (
              <SelectItem key={key} value={key}>
                {tpl.name} ({tpl.label})
              </SelectItem>
            ))}
            <SelectItem value="custom">📏 Custom Size</SelectItem>
          </SelectContent>
        </Select>

        {selected === "custom" && (
          <div className="space-y-2 mt-3 p-3 border rounded-lg bg-muted/25">
            <Label className="text-xs font-medium">Custom Passport Size (px @ 300 DPI)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  min="200"
                  max="1000"
                  value={customWidth || 413}
                  onChange={(e) => onCustomWidthChange?.(parseInt(e.target.value) || 413)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  min="200"
                  max="1200"
                  value={customHeight || 531}
                  onChange={(e) => onCustomHeightChange?.(parseInt(e.target.value) || 531)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {customWidth || 413} × {customHeight || 531}px
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


export default CountrySelector;
