import { strings } from "@/strings/en";

export function CareCircleIcon({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="18" fill="#234B3B" />
      <circle cx="32" cy="32" r="18" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.75" />
      <circle cx="32" cy="14" r="3.2" fill="#FFFFFF" />
      <circle cx="16.4" cy="41" r="3.2" fill="#FFFFFF" />
      <circle cx="47.6" cy="41" r="3.2" fill="#FFFFFF" />
      <path
        d="M32 39.5c-0.4 0-0.8-0.15-1.1-0.45-5.2-4.85-8.9-8.4-8.9-12.8 0-3.35 2.6-5.75 6-5.75 2.2 0 4.2 1.05 5.5 2.7 1.3-1.65 3.3-2.7 5.5-2.7 3.4 0 6 2.4 6 5.75 0 4.4-3.7 7.95-8.9 12.8-0.3 0.3-0.7 0.45-1.1 0.45z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function CareCircleWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSize = size === "sm" ? 32 : size === "md" ? 40 : 56;
  const textSize = size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <CareCircleIcon size={iconSize} />
      <span className={`${textSize} font-bold tracking-tight text-forest-deep`}>
        {strings.appName}
      </span>
    </div>
  );
}
