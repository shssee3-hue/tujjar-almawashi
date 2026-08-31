"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { filesToCompressedDataUrls } from "@/lib/image";

const MAX_IMAGES = 6;

export default function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور لكل إعلان`);
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    setLoading(true);
    try {
      const dataUrls = await filesToCompressedDataUrls(files);
      onChange([...images, ...dataUrls]);
    } catch {
      toast.error("تعذر معالجة إحدى الصور");
    } finally {
      setLoading(false);
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/20 text-black/40 hover:border-brand-secondary hover:text-brand-primary"
            >
              <span className="text-2xl">{loading ? "…" : "📷"}</span>
              <span className="text-xs">التقاط صورة</span>
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/20 text-black/40 hover:border-brand-secondary hover:text-brand-primary"
            >
              <span className="text-2xl">{loading ? "…" : "+"}</span>
              <span className="text-xs">إضافة صورة</span>
            </button>
          </>
        )}
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-black/40">
        حتى {MAX_IMAGES} صور حقيقية وواضحة. يتم ضغط الصور تلقائيًا.
      </p>
    </div>
  );
}
