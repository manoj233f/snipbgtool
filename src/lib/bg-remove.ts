import { removeBackground } from "@imgly/background-removal";

export type OutputMode = "transparent" | "cutout" | "isolated";

export interface ProcessOptions {
  mode: OutputMode;
  /** Hex color or null. Used for `isolated` or custom background. */
  backgroundColor?: string | null;
  /** Optional custom background image data URL (overrides backgroundColor). */
  backgroundImage?: string | null;
}

export async function processImage(file: File | Blob, options: ProcessOptions): Promise<Blob> {
  const cutoutBlob = await removeBackground(file);

  if (options.mode === "transparent" && !options.backgroundImage && !options.backgroundColor) {
    return cutoutBlob;
  }

  // Load cutout into image
  const cutoutUrl = URL.createObjectURL(cutoutBlob);
  const cutoutImg = await loadImage(cutoutUrl);
  URL.revokeObjectURL(cutoutUrl);

  const canvas = document.createElement("canvas");
  canvas.width = cutoutImg.naturalWidth;
  canvas.height = cutoutImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  if (options.backgroundImage) {
    const bgImg = await loadImage(options.backgroundImage);
    drawCover(ctx, bgImg, canvas.width, canvas.height);
  } else if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (options.mode === "isolated") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // For cutout mode with no background, keep transparent — composite the subject
  ctx.drawImage(cutoutImg, 0, 0);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const nw = img.naturalWidth * ratio;
  const nh = img.naturalHeight * ratio;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}