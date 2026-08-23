import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 0.35;
const MAX_WIDTH_OR_HEIGHT = 1280;

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
  return imageCompression.getDataUrlFromFile(compressed);
}

export async function filesToCompressedDataUrls(files: File[]): Promise<string[]> {
  const results: string[] = [];
  for (const file of files) {
    results.push(await fileToCompressedDataUrl(file));
  }
  return results;
}
