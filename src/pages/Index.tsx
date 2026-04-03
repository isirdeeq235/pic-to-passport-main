import { useState, useCallback } from "react";
import { Camera, ArrowRight, ArrowLeft, Loader2, ZoomIn, ZoomOut, Eye, EyeOff, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import StepIndicator from "@/components/StepIndicator";
import PhotoUpload from "@/components/PhotoUpload";
import BackgroundEditor from "@/components/BackgroundEditor";
import CountrySelector from "@/components/CountrySelector";
import PassportCanvas from "@/components/PassportCanvas";
import ExportPanel from "@/components/ExportPanel";
import { toast } from "sonner";
import {
  removeImageBackground,
  compositePassportPhoto,
  generatePrintSheet,
  downloadDataUrl,
  detectFacePosition,
  calculateFaceOffset,
  loadImage,
  getPassportTemplate,
  PASSPORT_TEMPLATES,
} from "@/lib/imageProcessing";


const Index = () => {
  const [step, setStep] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [transparentUrl, setTransparentUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [customBgUrl, setCustomBgUrl] = useState<string | undefined>();
  const [country, setCountry] = useState("eu");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [isAutoAligning, setIsAutoAligning] = useState(false);

  const [customWidth, setCustomWidth] = useState(413);
  const [customHeight, setCustomHeight] = useState(531);
  
  const template = getPassportTemplate(country, customWidth, customHeight);


  /** Auto-detect face and center it */
  const handleAutoAlign = useCallback(async () => {
    if (!transparentUrl) return;
    setIsAutoAligning(true);
    try {
      const facePos = await detectFacePosition(transparentUrl);
      if (!facePos) {
        toast.info("Face detection is not available in this browser. Please position manually.");
        return;
      }

      const img = await loadImage(transparentUrl);
      const offsets = calculateFaceOffset(
        facePos,
        img.width,
        img.height,
        template.width,
        template.height,
        scale
      );
      setOffsetX(offsets.offsetX);
      setOffsetY(offsets.offsetY);
      toast.success("Face centered automatically!");
    } catch {
      toast.info("Could not detect face. Please position manually.");
    } finally {
      setIsAutoAligning(false);
    }
  }, [transparentUrl, template, scale]);

  const handlePhotoSelected = useCallback(
    async (file: File, previewUrl: string) => {
      const mime = file.type.toLowerCase();
      const hasSupportedMime = mime.startsWith("image/");
      const hasSupportedExtension = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);

      if (!hasSupportedMime && !hasSupportedExtension) {
        toast.error("Unsupported file. Please upload an image (JPG, PNG, WEBP, or HEIC).");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image is too large. Please upload a file under 20MB.");
        return;
      }

      setOriginalFile(file);
      setOriginalPreview(previewUrl);
      setIsProcessing(true);
      setProcessingProgress(0);

      try {
        toast.info("Removing background...", { duration: 60000, id: "bg-remove" });
        const result = await removeImageBackground(file, (progress) => {
          setProcessingProgress(progress);
        });
        setTransparentUrl(result);
        toast.dismiss("bg-remove");
        toast.success("Background removed successfully!");
        setStep(1);

        // Try auto face alignment after background removal
        try {
          const facePos = await detectFacePosition(result);
          if (facePos) {
            const img = await loadImage(result);
            const offsets = calculateFaceOffset(
              facePos, img.width, img.height,
              template.width, template.height, 1
            );
            setOffsetX(offsets.offsetX);
            setOffsetY(offsets.offsetY);
          }
        } catch {
          // Silent — manual alignment is always available
        }
      } catch (err: any) {
        console.error("Background removal failed:", err?.message || err);
        toast.dismiss("bg-remove");
        toast.error(err?.message || "Background removal failed");
        setTransparentUrl("");
        setStep(0);
      } finally {
        setIsProcessing(false);
      }
    },
    [template]
  );

  const getCompositeDataUrl = useCallback(async () => {
    return compositePassportPhoto({
      foregroundUrl: transparentUrl,
      backgroundColor: bgColor,
      backgroundImageUrl: customBgUrl,
      width: template.width,
      height: template.height,
      offsetX,
      offsetY,
      scale,
    });
  }, [transparentUrl, bgColor, customBgUrl, template, offsetX, offsetY, scale]);

  const handleDownloadSingle = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataUrl = await getCompositeDataUrl();
      downloadDataUrl(dataUrl, "passport-photo.png");
      toast.success("Photo downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [getCompositeDataUrl]);

  const handleDownloadSheet4 = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataUrl = await getCompositeDataUrl();
      const sheet = await generatePrintSheet(dataUrl, template.width, template.height, 2, 2, 10);
      downloadDataUrl(sheet, `passport-sheet-4.png`);
      toast.success("Print sheet (4 photos) downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [getCompositeDataUrl, template]);


  const handleDownloadSheet6 = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataUrl = await getCompositeDataUrl();
      const sheet = await generatePrintSheet(dataUrl, template.width, template.height, 2, 3, 10);
      downloadDataUrl(sheet, `passport-sheet-6.png`);
      toast.success("Print sheet (6 photos) downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [getCompositeDataUrl, template]);


  const handleDownloadCustomSheet = useCallback(async (rows: number, cols: number, gap: number, topMargin: number, bottomMargin: number, leftMargin: number, rightMargin: number, pageBorderWidth: number, pageBorderColor: string) => {
    setIsExporting(true);
    try {
      const dataUrl = await getCompositeDataUrl();
      const sheet = await generatePrintSheet(dataUrl, template.width, template.height, rows, cols, gap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor);
      const totalPhotos = rows * cols;
      downloadDataUrl(sheet, `passport-sheet-${rows}x${cols}-margins${topMargin}-${bottomMargin}-${leftMargin}-${rightMargin}.png`);
      toast.success(`Print sheet (${rows}×${cols} = ${totalPhotos} photos) with custom margins & border downloaded!`);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [getCompositeDataUrl, template]);



  const handleReset = useCallback(() => {
    setStep(0);
    setOriginalFile(null);
    setOriginalPreview("");
    setTransparentUrl("");
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
    setCustomBgUrl(undefined);
    setBgColor("#FFFFFF");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Passport Photo Maker</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {template.name} · {template.label}
            </span>
            {step >= 1 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                New Photo
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container px-4">
        <StepIndicator currentStep={step} />
      </div>

      <main className="container px-4 pb-12">
        {step === 0 && (
          <div className="max-w-md mx-auto">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="w-64">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(processingProgress, 10)}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Removing background... {processingProgress > 0 ? `${processingProgress}%` : ""}
                </p>
              </div>
            ) : (
              <PhotoUpload onPhotoSelected={handlePhotoSelected} />
            )}
          </div>
        )}

{step >= 1 && transparentUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1 space-y-8 order-2 lg:order-1 w-full">
              <BackgroundEditor
                selectedColor={bgColor}
                onColorSelect={(c) => {
                  setBgColor(c);
                  setCustomBgUrl(undefined);
                }}
                onCustomBackground={(url) => setCustomBgUrl(url)}
                customBackgroundUrl={customBgUrl}
                previewUrl={transparentUrl}
              />
              <CountrySelector
                selected={country}
                customWidth={customWidth}
                customHeight={customHeight}
                onCustomWidthChange={setCustomWidth}
                onCustomHeightChange={setCustomHeight}
                onSelect={(key) => {
                  setCountry(key);
                  setOffsetX(0);
                  setOffsetY(0);
                }}
              />

            </div>

            <div className="flex-1 flex flex-col items-center gap-4 order-1 lg:order-2">
              <PassportCanvas
                foregroundUrl={transparentUrl}
                backgroundColor={bgColor}
                backgroundImageUrl={customBgUrl}
                width={template.width}
                height={template.height}
                offsetX={offsetX}
                offsetY={offsetY}
                scale={scale}
                onOffsetChange={(x, y) => {
                  setOffsetX(x);
                  setOffsetY(y);
                }}
                showGuides={showGuides && step === 2}
              />

              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[scale]}
                    onValueChange={([v]) => setScale(v)}
                    min={0.5}
                    max={2}
                    step={0.05}
                    className="w-32"
                  />
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>
                {step === 2 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGuides(!showGuides)}
                    >
                      {showGuides ? (
                        <EyeOff className="w-4 h-4 mr-1" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      Guides
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoAlign}
                      disabled={isAutoAligning}
                    >
                      <Focus className="w-4 h-4 mr-1" />
                      {isAutoAligning ? "Detecting..." : "Auto Align"}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                {step < 3 && (
                  <Button onClick={() => setStep(step + 1)}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full lg:w-56 space-y-6 order-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Photo Info</h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Size:</span>{" "}
                    {template.width} × {template.height} px
                  </p>
                  <p>
                    <span className="font-medium text-foreground">DPI:</span> 300
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Format:</span> PNG
                  </p>npm 
                  <p>
                    <span className="font-medium text-foreground">Template:</span>{" "}
                    {template.name}
                  </p>
                </div>
              </div>

              <ExportPanel
                onDownloadSingle={handleDownloadSingle}
                onDownloadSheet4={handleDownloadSheet4}
                onDownloadSheet6={handleDownloadSheet6}
                onDownloadCustomSheet={handleDownloadCustomSheet}
                onPreviewSheet={async (rows, cols, gap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor) => {
                  const dataUrl = await getCompositeDataUrl();
                  return generatePrintSheet(dataUrl, template.width, template.height, rows, cols, gap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor);
                }}
                isExporting={isExporting}
              />


            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
