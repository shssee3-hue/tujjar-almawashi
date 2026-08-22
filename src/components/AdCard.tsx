import Link from "next/link";
import Image from "next/image";
import { Ad } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-SA").format(price);
}

export default function AdCard({ ad }: { ad: Ad }) {
  const cover = ad.images?.[0];

  return (
    <Link
      href={`/ad?id=${ad.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-bg-light">
        {cover ? (
          <Image
            src={cover}
            alt={ad.title}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🐐</div>
        )}
        {ad.featured && (
          <span className="absolute top-2 right-2 rounded-full bg-brand-secondary px-3 py-1 text-xs font-bold text-brand-bg-dark shadow">
            مميز
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-bold text-brand-bg-dark">{ad.title}</h3>
        <p className="text-sm text-black/50">
          {ad.breed} • {ad.city}, {ad.region}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-extrabold text-brand-primary">
            {formatPrice(ad.price)} ريال
            {ad.isNegotiable && (
              <span className="ms-1 text-xs font-normal text-black/40">(قابل للتفاوض)</span>
            )}
          </span>
          <span className="text-xs text-black/40">👁 {ad.views}</span>
        </div>
      </div>
    </Link>
  );
}
