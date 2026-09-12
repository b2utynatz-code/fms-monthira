"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Link as LinkIcon,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Move,
  Crop,
} from "lucide-react";
import { toast } from "sonner";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import { uploadLogoAction } from "@/features/identity/actions";

interface LogoStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLogoUrl?: string | null;
  onSuccess: (newLogoUrl: string) => void;
}

const MAX_TARGET_BYTES = 200 * 1024; // 200 KB
const CANVAS_OUTPUT_DIMENSION = 512; // 512x512 pixels

export function LogoStudioDialog({
  open,
  onOpenChange,
  currentLogoUrl,
  onSuccess,
}: LogoStudioDialogProps) {
  const t = useT();

  // Tab: 'upload' | 'url'
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");

  // Image source
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Edit controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // -180 to 180 degrees
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [maskShape, setMaskShape] = useState<"square" | "circle">("square");

  // Output stats
  const [outputBytes, setOutputBytes] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle open/close and resetting studio state
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setImageSrc(currentLogoUrl || null);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setOutputBytes(null);
      setUrlInput("");
    }
    onOpenChange(nextOpen);
  };

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;

    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (active) setLoadedImage(img);
    };
    img.onerror = () => {
      if (active) toast.error("ไม่สามารถโหลดภาพนี้ได้ กรุณาตรวจสอบ URL หรือเลือกไฟล์อื่น");
    };
    img.src = imageSrc;

    return () => {
      active = false;
    };
  }, [imageSrc]);

  // Render on canvas whenever transforms or loaded image change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background pattern (transparent checkerboard)
    const tileSize = 16;
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? "#f8fafc" : "#f1f5f9";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    if (loadedImage) {
      ctx.save();

      // Center transformation
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered
      const imgWidth = loadedImage.naturalWidth || loadedImage.width;
      const imgHeight = loadedImage.naturalHeight || loadedImage.height;
      const maxSide = Math.max(imgWidth, imgHeight);
      const fitScale = (width * 0.85) / maxSide;
      const drawW = imgWidth * fitScale;
      const drawH = imgHeight * fitScale;

      ctx.drawImage(loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);

      ctx.restore();
    }

    // Draw Mask Overlay
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.4)"; // Dark overlay
    ctx.beginPath();
    ctx.rect(0, 0, width, height);

    const frameMargin = 24;
    const frameSize = width - frameMargin * 2;
    const frameRadius = maskShape === "circle" ? frameSize / 2 : 16;

    if (maskShape === "circle") {
      ctx.arc(width / 2, height / 2, frameRadius, 0, Math.PI * 2, true);
    } else {
      // Rounded rect cutout
      ctx.roundRect(frameMargin, frameMargin, frameSize, frameSize, frameRadius);
    }
    ctx.fill("evenodd");

    // Frame Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [loadedImage, pan, rotation, zoom, maskShape]);

  // Export & compress image to blob <= 200KB
  const generateExportBlob = useCallback(async (): Promise<{ blob: Blob; sizeKb: number }> => {
    if (!loadedImage) throw new Error("No image loaded");

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_OUTPUT_DIMENSION;
    exportCanvas.height = CANVAS_OUTPUT_DIMENSION;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get export canvas context");

    const w = CANVAS_OUTPUT_DIMENSION;
    const h = CANVAS_OUTPUT_DIMENSION;

    // Fill white background for non-transparent export
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Apply exact same transforms scaled to export resolution
    const scaleFactor = CANVAS_OUTPUT_DIMENSION / (canvasRef.current?.width || 360);
    ctx.save();
    ctx.translate(w / 2 + pan.x * scaleFactor, h / 2 + pan.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    const imgWidth = loadedImage.naturalWidth || loadedImage.width;
    const imgHeight = loadedImage.naturalHeight || loadedImage.height;
    const maxSide = Math.max(imgWidth, imgHeight);
    const fitScale = (360 * 0.85) / maxSide;
    const drawW = imgWidth * fitScale;
    const drawH = imgHeight * fitScale;

    ctx.drawImage(loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Loop to compress under 200 KB
    let quality = 0.92;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob((b) => resolve(b), "image/jpeg", quality);
      });

      if (blob && blob.size <= MAX_TARGET_BYTES) {
        break;
      }
      quality -= 0.12;
      if (quality < 0.2) quality = 0.2;
    }

    if (!blob) throw new Error("Failed to create blob");
    const sizeKb = Math.round(blob.size / 1024);
    setOutputBytes(blob.size);
    return { blob, sizeKb };
  }, [loadedImage, pan, rotation, zoom]);

  // Update estimate on transform change
  useEffect(() => {
    if (loadedImage) {
      const timer = setTimeout(() => {
        generateExportBlob().catch(() => {});
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loadedImage, generateExportBlob]);

  // Handle Drag events on Canvas for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  // Center button handler
  const handleCenter = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Rotate 90 degrees
  const handleRotate90 = () => {
    setRotation((prev) => {
      const next = prev + 90;
      return next > 180 ? next - 360 : next;
    });
  };

  // File selection
  const handleFileSelect = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ PNG, JPG, JPEG หรือ WEBP เท่านั้น");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setImageSrc(e.target.result);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // URL loading
  const handleLoadUrl = () => {
    if (!urlInput.trim()) {
      toast.error("กรุณาระบุ URL รูปภาพ");
      return;
    }
    setLoadingUrl(true);
    setImageSrc(urlInput.trim());
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setLoadingUrl(false);
  };

  // Submit and upload
  const handleApplyAndUpload = async () => {
    if (!loadedImage) {
      toast.error("กรุณาเลือกหรืออัปโหลดรูปภาพก่อน");
      return;
    }

    setIsUploading(true);
    try {
      const { blob, sizeKb } = await generateExportBlob();
      const file = new File([blob], `logo-${Date.now()}.jpg`, { type: "image/jpeg" });

      const fd = new FormData();
      fd.append("file", file);

      const res = await uploadLogoAction(fd);
      if (res.ok) {
        toast.success(`อัปโหลดโลโก้สำเร็จ (ขนาด ${sizeKb} KB)`);
        onSuccess(res.data.url);
        onOpenChange(false);
      } else {
        toast.error(res.error.message || "เกิดข้อผิดพลาดในการอัปโหลด");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <LiyonDialog open={open} onOpenChange={handleOpenChange} wide>
      <LiyonDialogHeader
        title={t("settings.logoStudioTitle")}
        description={t("settings.logoStudioDesc")}
      />

      <LiyonDialogBody className="max-h-[75vh] overflow-y-auto pr-1">
        <div className="space-y-4">
          {/* Source Tabs */}
          <div className="flex items-center gap-1 border-b pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t("settings.logoTabUpload")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "url"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>{t("settings.logoTabUrl")}</span>
            </button>
          </div>

          {/* Tab 1: Drag and Drop Dropzone */}
          {activeTab === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/png,image/jpeg,image/jpg,image/webp";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileSelect(file);
                };
                input.click();
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t("settings.logoDropzone")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t("settings.logoDropzoneHint")} • บีบอัดให้อัตโนมัติ &le; 200 KB
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: External Image URL */}
          {activeTab === "url" && (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 rounded-md border px-3 py-2 text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleLoadUrl}
                disabled={loadingUrl || !urlInput.trim()}
                className="gap-1 text-xs shrink-0"
              >
                {loadingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                <span>{t("settings.logoUrlBtn")}</span>
              </Button>
            </div>
          )}

          {/* Interactive Canvas & Editing Studio */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Viewport Canvas */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden border shadow-inner bg-muted/20 select-none touch-none">
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={360}
                  className="cursor-move max-w-full h-auto"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                />

                {/* Helper overlay hints */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[10px] text-white/80 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  <span className="flex items-center gap-1">
                    <Move className="h-3 w-3" /> ลากเพื่อเลื่อนตำแหน่ง
                  </span>
                  <span>กรอบสีขาวคือส่วนที่จะถูกครอบ</span>
                </div>
              </div>

              {/* Size Badge Indicator */}
              <div className="mt-2.5 flex items-center gap-2">
                {outputBytes !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      outputBytes <= MAX_TARGET_BYTES
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>ขนาดไฟล์: {Math.round(outputBytes / 1024)} KB (ไม่เกิน 200 KB)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="md:col-span-5 space-y-4 bg-muted/20 p-3.5 rounded-xl border">
              {/* Zoom Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="h-3.5 w-3.5 text-primary" />
                    <span>{t("settings.logoZoom")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                    className="p-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0.4"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-primary h-1.5 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                    className="p-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Rotation / Tilt Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3.5 w-3.5 text-primary" />
                    <span>{t("settings.logoRotate")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 accent-primary h-1.5 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleRotate90}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1 shrink-0"
                    title="หมุน 90 องศา"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>90°</span>
                  </button>
                </div>
              </div>

              {/* Mask Preview Shape */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium">{t("settings.logoCropShape")}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaskShape("square")}
                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                      maskShape === "square"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {t("settings.logoShapeSquare")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaskShape("circle")}
                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                      maskShape === "circle"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {t("settings.logoShapeCircle")}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Center & Reset */}
              <div className="pt-2 border-t flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCenter}
                  className="gap-1.5 text-xs flex-1"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{t("settings.logoCenter")}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t("settings.logoReset")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </LiyonDialogBody>

      <LiyonDialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleApplyAndUpload}
          disabled={isUploading || !imageSrc}
          className="gap-1.5 bg-primary font-semibold"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังบันทึกภาพ...</span>
            </>
          ) : (
            <>
              <Crop className="h-4 w-4" />
              <span>{t("settings.logoApply")}</span>
            </>
          )}
        </Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
