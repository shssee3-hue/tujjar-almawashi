export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-30"
      >
        السابق
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
            p === page
              ? "bg-brand-primary text-white"
              : "border border-black/10 text-brand-bg-dark hover:bg-black/5"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-30"
      >
        التالي
      </button>
    </div>
  );
}
