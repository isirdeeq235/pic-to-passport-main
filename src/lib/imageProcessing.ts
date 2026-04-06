import { removeBackground } from "@imgly/background-removal";
import { supabase } from "@/integrations/supabase/client";

/** Standard passport photo dimensions at 300 DPI */
export const PASSPORT_WIDTH = 430; // 35mm at 300 DPI
export const PASSPORT_HEIGHT = 550; // 45mm at 300 DPI

/** Country-specific passport templates with dimensions in pixels at 300 DPI */
export interface PassportTemplate {
  name: string;
  width: number;
  height: number;
  label: string;
}

export const PASSPORT_TEMPLATES: Record<string, PassportTemplate> = {
  us: { name: "United States", width: 600, height: 600, label: "2×2 in (51×51mm)" },
  uk: { name: "United Kingdom", width: 413, height: 531, label: "35×45mm" },
  eu: { name: "European Union", width: 413, height: 531, label: "35×45mm" },
  ng: { name: "Nigeria", width: 413, height: 531, label: "35×45mm" },
  in: { name: "India", width: 413, height: 531, label: "35×45mm" },
  cn: { name: "China", width: 390, height: 567, label: "33×48mm" },
  ca: { name: "Canada", width: 591, height: 827, label: "50×70mm" },
  au: { name: "Australia", width: 413, height: 531, label: "35×45mm" },
  jp: { name: "Japan", width: 413, height: 531, label: "35×45mm" },
};

/**
 * Gets passport template, supporting custom dimensions.
 */
export function getPassportTemplate(
  country: string,
  customWidth?: number,
  customHeight?: number
): PassportTemplate {
  if (country === "custom" && customWidth && customHeight) {
    return {
      name: "Custom Size",
      width: customWidth,
      height: customHeight,
      label: `${customWidth}×${customHeight}px`,
    };
  }
  return PASSPORT_TEMPLATES[country as keyof typeof PASSPORT_TEMPLATES] || PASSPORT_TEMPLATES.eu;
}


/** Background color presets */
export const BACKGROUND_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Blue", value: "#2563EB" },
  { name: "Red", value: "#DC2626" },
  { name: "Light Blue", value: "#DBEAFE" },
  { name: "Light Gray", value: "#F1F5F9" },
];

/**
 * Converts any image file (including HEIC) to a PNG blob via canvas.
 */
async function normalizeImageToPng(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert image to PNG"));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Client-side request deduplication cache.
 * Maps a simple file signature → blob URL of the result.
 */
const clientCache = new Map<string, string>();

function getFileSignature(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

/**
 * Removes the background from an image entirely in the browser using @imgly/background-removal.
 * No API key required.
 */
export async function removeImageBackground(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const sig = getFileSignature(imageFile);
  const cached = clientCache.get(sig);
  if (cached) {
    console.log("[BG Removal] Using cached result");
    onProgress?.(100);
    return cached;
  }

  console.log("[BG Removal] Starting client-side background removal...");
  onProgress?.(5);

  try {
    const blob = await removeBackground(imageFile, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 90) + 5;
          onProgress?.(Math.min(pct, 95));
        }
      },
    });

    const blobUrl = URL.createObjectURL(blob);
    clientCache.set(sig, blobUrl);
    onProgress?.(100);
    console.log("[BG Removal] Success, result size:", blob.size, "bytes");
    return blobUrl;
  } catch (err) {
    console.error("[BG Removal] Failed:", err);
    throw new Error("Background removal failed. Please try again with a different image.");
  }
}

/**
 * Loads an image from a URL and returns an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Attempts face detection using the browser's FaceDetector API.
 * Returns the center position of the first detected face relative to image dimensions,
 * or null if unavailable/no face found.
 */
export async function detectFacePosition(
  imageUrl: string
): Promise<{ centerX: number; centerY: number; faceHeight: number } | null> {
  // Check if FaceDetector API is available
  if (!("FaceDetector" in window)) {
    console.log("[Face Detection] FaceDetector API not available in this browser");
    return null;
  }

  try {
    const img = await loadImage(imageUrl);
    // @ts-ignore - FaceDetector is experimental
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);

    if (faces.length === 0) {
      console.log("[Face Detection] No faces detected");
      return null;
    }

    const face = faces[0].boundingBox;
    return {
      centerX: (face.x + face.width / 2) / img.width,
      centerY: (face.y + face.height / 2) / img.height,
      faceHeight: face.height / img.height,
    };
  } catch (err) {
    console.log("[Face Detection] Detection failed:", err);
    return null;
  }
}

/**
 * Calculates offset to center the face in the passport photo.
 * Uses face detection result and target dimensions.
 */
export function calculateFaceOffset(
  facePos: { centerX: number; centerY: number; faceHeight: number },
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  currentScale: number
): { offsetX: number; offsetY: number } {
  const fgScale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight) * currentScale;
  const fw = imgWidth * fgScale;
  const fh = imgHeight * fgScale;

  // Face center in canvas coordinates
  const faceCX = (targetWidth - fw) / 2 + facePos.centerX * fw;
  const faceCY = (targetHeight - fh) / 2 + facePos.centerY * fh;

  // Target: face center should be at ~40% from top, horizontally centered
  const targetCX = targetWidth / 2;
  const targetCY = targetHeight * 0.38;

  return {
    offsetX: targetCX - faceCX,
    offsetY: targetCY - faceCY,
  };
}

/**
 * Composites the foreground onto a background, cropped to passport dimensions.
 */
export async function compositePassportPhoto(options: {
  foregroundUrl: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}): Promise<string> {
  const {
    foregroundUrl,
    backgroundColor = "#FFFFFF",
    backgroundImageUrl,
    width,
    height,
    offsetX = 0,
    offsetY = 0,
    scale = 1,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  
  if (backgroundImageUrl) {
    const bgImg = await loadImage(backgroundImageUrl);
    const bgScale = Math.max(width / bgImg.width, height / bgImg.height);
    const bw = bgImg.width * bgScale;
    const bh = bgImg.height * bgScale;
    ctx.drawImage(bgImg, (width - bw) / 2, (height - bh) / 2, bw, bh);
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const fgImg = await loadImage(foregroundUrl);
  const fgScale = Math.min(width / fgImg.width, height / fgImg.height) * scale;
  const fw = fgImg.width * fgScale;
  const fh = fgImg.height * fgScale;
  const fx = (width - fw) / 2 + offsetX;
  const fy = (height - fh) / 2 + offsetY;
  ctx.drawImage(fgImg, fx, fy, fw, fh);

  return canvas.toDataURL("image/png");
}

/**
 * Generates a printable sheet with multiple passport photos in a configurable grid.
 * Fully customizable margins and border line. Supports custom A4 page border.
 */
export async function generatePrintSheet(
  photoDataUrl: string,
  photoWidth: number,
  photoHeight: number,
  rows: number,
  cols: number,
  interPhotoGap: number = 20,
  topMargin: number = 60,
  bottomMargin: number = 60,
  leftMargin: number = 60,
  rightMargin: number = 60,
  pageBorderWidth: number = 8,
  pageBorderColor: string = "#CBD5E1"
): Promise<string> {
  const img = await loadImage(photoDataUrl);

  const A4_WIDTH = 2480;
  const A4_HEIGHT = 3508;
  
  const canvas = document.createElement("canvas");
  canvas.width = A4_WIDTH;
  canvas.height = A4_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

// Draw A4 page border if enabled (default: 8px)
if (pageBorderWidth > 0) {
  ctx.strokeStyle = pageBorderColor;
  ctx.lineWidth = pageBorderWidth;
  ctx.strokeRect(0, 0, A4_WIDTH, A4_HEIGHT);
}


  // Content area
  const contentWidth = A4_WIDTH - leftMargin - rightMargin;
  const contentHeight = A4_HEIGHT - topMargin - bottomMargin;

  // Grid positioning starting from custom margins
  const startX = leftMargin;
  const startY = topMargin;
  
  // Scale photos to fit content width
  const availableW = contentWidth - (cols - 1) * interPhotoGap;
  const photoScaledW = availableW / cols;
  const scaleX = photoScaledW / photoWidth;
  const photoScaledH = photoHeight * scaleX;
  const photoDrawW = photoScaledW;
  const photoDrawH = photoScaledH;

  // Validation
  const totalGridH = rows * photoScaledH + (rows - 1) * interPhotoGap;
  if (totalGridH > contentHeight) {
    console.warn(`Grid ${rows}x${cols} (${totalGridH.toFixed(0)}px tall) exceeds content height ${contentHeight}px`);
  }

  // Draw photo grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoScaledW + interPhotoGap);
      const y = startY + r * (photoScaledH + interPhotoGap);

      // Individual photo dashed border
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(x - 1, y - 1, photoScaledW + 2, photoScaledH + 2);
      ctx.setLineDash([]);

      // Photo
      ctx.drawImage(img, x, y, photoDrawW, photoDrawH);
    }
  }

  return canvas.toDataURL("image/png");
}



/**
 * Generates PDF version of the print sheet using jsPDF.
 */
export async function generatePrintSheetPdf(
  photoDataUrl: string,
  photoWidth: number,
  photoHeight: number,
  rows: number,
  cols: number,
  interPhotoGap: number = 20,
  topMargin: number = 60,
  bottomMargin: number = 60,
  leftMargin: number = 60,
  rightMargin: number = 60,
  pageBorderWidth: number = 8,
  pageBorderColor: string = "#CBD5E1"
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const pngDataUrl = await generatePrintSheet(photoDataUrl, photoWidth, photoHeight, rows, cols, interPhotoGap, topMargin, bottomMargin, leftMargin, rightMargin, pageBorderWidth, pageBorderColor);
  
  const doc = new jsPDF({
    unit: 'px',
    format: [2480, 3508], // A4 at 300 DPI
  });
  
  doc.addImage(pngDataUrl, 'PNG', 0, 0, 2480, 3508, '', 'FAST');
  return doc.output('datauristring');
}

/**
 * Triggers a browser download for a given data URL.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

