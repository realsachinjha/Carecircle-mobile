const COLOR_PALETTES = [
  { bg: "bg-peach", capTop: "#D98269", capBottom: "#FFFFFF" },
  { bg: "bg-sage-soft", capTop: "#234B3B", capBottom: "#FFFFFF" },
  { bg: "bg-amber-50", capTop: "#D97706", capBottom: "#FEF3C7" },
  { bg: "bg-sky-50", capTop: "#0284C7", capBottom: "#E0F2FE" },
  { bg: "bg-rose-50", capTop: "#E11D48", capBottom: "#FFE4E6" },
];

const DEFAULT_PALETTE = { bg: "bg-peach", capTop: "#D98269", capBottom: "#FFFFFF" };

export function MedicineCapsuleIcon({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  const palette = COLOR_PALETTES[index] ?? DEFAULT_PALETTE;

  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${palette.bg} shadow-2xs`}>
      <svg className="h-7 w-7 -rotate-45" viewBox="0 0 32 32" fill="none">
        <rect x="10" y="4" width="12" height="12" rx="6" fill={palette.capTop} />
        <rect x="10" y="16" width="12" height="12" rx="6" fill={palette.capBottom} stroke="#E5E4DC" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
