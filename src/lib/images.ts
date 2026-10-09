import { MAX_UPLOAD_MB } from '../config/site';

export const MAX_EDGE = 2400;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface PreparedImage {
  blob: Blob;
  ext: 'webp' | 'jpg';
  width: number;
  height: number;
  previewUrl: string;
}

/** Scale (w, h) so the longest edge is at most `max`, preserving aspect ratio. */
export function fitWithin(w: number, h: number, max = MAX_EDGE): { width: number; height: number } {
  if (w <= 0 || h <= 0) throw new Error('Invalid image dimensions');
  const k = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * k), height: Math.round(h * k) };
}

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(file: { name: string; type: string; size: number }, maxMb = MAX_UPLOAD_MB): string | null {
  const type = file.type.toLowerCase();
  const looksLikeImage = type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!looksLikeImage) return `${file.name}: not an image file`;
  if (type && type.startsWith('image/') && !ACCEPTED_TYPES.includes(type)) {
    return `${file.name}: unsupported format (${type}). Use JPG, PNG or WebP.`;
  }
  if (file.size > maxMb * 1024 * 1024) return `${file.name}: larger than ${maxMb} MB`;
  if (file.size === 0) return `${file.name}: file is empty`;
  return null;
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; w: number; h: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, w: img.naturalWidth, h: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('This photo could not be read. If it is HEIC, change the camera format to “Most compatible” or upload a JPG.');
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Resize to ≤ MAX_EDGE and re-encode as WebP (JPEG fallback where WebP encoding is unsupported). */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const { source, w, h, close } = await decode(file);
  try {
    const { width, height } = fitWithin(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);

    let blob = await toBlob(canvas, 'image/webp', 0.82);
    let ext: PreparedImage['ext'] = 'webp';
    if (!blob || blob.type !== 'image/webp') {
      blob = await toBlob(canvas, 'image/jpeg', 0.85);
      ext = 'jpg';
    }
    if (!blob) throw new Error('Could not compress this photo');
    return { blob, ext, width, height, previewUrl: URL.createObjectURL(blob) };
  } finally {
    close();
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
