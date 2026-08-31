import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 0.35;
const MAX_WIDTH_OR_HEIGHT = 1280;

// Compresses a picked image to a small JPEG Blob, ready to hand to
// src/lib/storage.ts for upload to Cloud Storage. (It used to return a
// Base64 data-URL that got written straight onto the Firestore doc, which
// bloated every ad document and risked the 1 MiB per-doc limit.)
export async function fileToCompressedBlob(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}
