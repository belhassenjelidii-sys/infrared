// Real InfraRed logo — centralised here so every usage (header, footer,
// dashboards, favicon) stays in sync. Source files live in /public:
//   - logo.png        full lockup (glasses mark + wordmark), transparent bg
//   - logo-mark.png    glasses mark only, transparent bg (compact/favicon use)
// Do not redraw, recolor, or reproportion these assets.

export default function Logo({
  className = "",
  variant = "default",
  mark = false,
  src: customSrc,
  height: customHeight,
}: {
  className?: string;
  variant?: "default" | "reversed";
  /** Show only the glasses mark (no wordmark) — for tight spaces. */
  mark?: boolean;
  src?: string | null;
  height?: number;
}) {
  const src = customSrc || (mark ? "/logo-mark.png" : "/logo.png");
  const ratio = mark ? 797 / 336 : 797 / 544;
  const height = Math.min(80, Math.max(28, customHeight ?? (mark ? 28 : 40)));
  const width = height * ratio;

  const img = (
    <img
      src={src}
      alt="InfraRed Optic-Store"
      className="object-contain"
      style={{ height, width: customSrc ? "auto" : width, maxWidth: 220 }}
    />
  );

  if (variant === "reversed") {
    // The wordmark is black-on-transparent, so on dark backgrounds (footer,
    // dashboards) we present it on a small white plate to keep it legible
    // without ever altering the logo itself.
    return (
      <span
        className={`inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm ${className}`}
        style={{ height: height + 16 }}
      >
        {img}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`} style={{ height }}>
      {img}
    </span>
  );
}
