import Link from "next/link";
import Image from "next/image";
import { Ad } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";

export default function AdCard({ ad }: { ad: Ad }) {
  const cover = ad.images?.[0];
  const category = ad.category || "livestock";

  return (
    <Link
      href={`/ad?id=${ad.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-bg-light">
        {cover ? (
          <Image
            src={cover}
            alt={ad.title}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🐐</div>
        )}
        {ad.featured && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-brand-secondary px-2 py-0.5 text-[10px] font-bold text-brand-bg-dark shadow">
            مميز
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <h3 className="line-clamp-1 text-sm font-bold text-brand-bg-dark">{ad.title}</h3>
        <p className="line-clamp-1 text-xs text-black/50">
          {CATEGORY_LABELS[category]} • {ad.region}
        </p>
      </div>
    </Link>
  );
}
