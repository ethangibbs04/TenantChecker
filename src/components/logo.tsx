const SIZES = {
  sm: { icon: 20, text: "text-base" },
  md: { icon: 26, text: "text-xl" },
  lg: { icon: 34, text: "text-2xl" },
} as const;

export function Logo({
  className,
  iconOnly = false,
  size = "md",
  variant = "dark",
}: {
  className?: string;
  iconOnly?: boolean;
  size?: keyof typeof SIZES;
  /** "dark" text for light backgrounds (default), "light" text for dark/navy backgrounds. */
  variant?: "dark" | "light";
}) {
  const { icon, text } = SIZES[size];
  const wordmarkColor = variant === "light" ? "text-white" : "text-navy-900";
  const shieldColor = variant === "light" ? "fill-white" : "fill-navy-700";
  const checkColor = variant === "light" ? "text-sky-400" : "text-sky-600";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M12 2.5 4.5 5.25v5.4c0 5.06 3.2 9.15 7.5 10.85 4.3-1.7 7.5-5.79 7.5-10.85v-5.4L12 2.5Z"
          className={shieldColor}
        />
        <path
          d="M8.25 12.4 11 15.15l4.75-5.3"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-sky-400"
        />
      </svg>
      {!iconOnly && (
        <span className={`font-display font-medium tracking-tight ${text}`}>
          <span className={wordmarkColor}>Tenant</span>
          <span className={checkColor}>check</span>
        </span>
      )}
    </span>
  );
}
