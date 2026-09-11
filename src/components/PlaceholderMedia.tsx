// Used anywhere a real photo (product, brand, boutique) isn't available yet.
// Deliberately looks like a placeholder, not a stock photo pretending to be
// the real thing — swap it out once real photography is uploaded (see
// src/lib/data.ts and the "isPlaceholder" flags on Product/Category/Store).

export default function PlaceholderMedia({
  label,
  tone = "light",
  className = "",
  animated = false,
}: {
  label?: string;
  tone?: "light" | "dark";
  className?: string;
  /** Reacts to the parent's `group` hover (e.g. inside a ProductCard) to
   *  preview the same "look from another angle" interaction real photos
   *  will have — swap this component for real <Image> pairs once photos
   *  exist and the hover effect carries over automatically. */
  animated?: boolean;
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden ${
        isDark ? "bg-ink" : "bg-gradient-to-br from-mist via-white to-mist"
      } ${className}`}
    >
      <svg
        width="44"
        height="28"
        viewBox="0 0 90 40"
        fill="none"
        className={`${isDark ? "text-white/20" : "text-ink/15"} ${
          animated ? "transition-transform duration-500 ease-out group-hover:scale-125 group-hover:-rotate-6" : ""
        }`}
      >
        <circle cx="24" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="66" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" />
        <path d="M40 17c2-3 8-3 10 0" stroke="currentColor" strokeWidth="2.5" />
        <path d="M8 16 L1 14" stroke="currentColor" strokeWidth="2.5" />
        <path d="M82 16 L89 14" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      {label && (
        <p
          className={`px-4 text-center text-[10px] font-medium uppercase tracking-wider transition-opacity duration-300 ${
            isDark ? "text-white/30" : "text-ink/25"
          } ${animated ? "group-hover:opacity-0" : ""}`}
        >
          {label}
        </p>
      )}
      {animated && (
        <p
          className={`absolute px-4 text-center text-[10px] font-medium uppercase tracking-wider opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
            isDark ? "text-white/40" : "text-red/60"
          }`}
        >
          Autre angle — photo à venir
        </p>
      )}
    </div>
  );
}
