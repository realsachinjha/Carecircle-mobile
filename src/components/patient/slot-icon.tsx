import type { Slot } from "@/lib/gemini/schema";

export function SlotIcon({ slot, className = "" }: { slot: Slot | string; className?: string }) {
  if (slot === "MORNING") {
    return (
      <svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <line x1={4} y1={28} x2={36} y2={28} />
        <path d="M12 28 a8 8 0 0 1 16 0" />
        <line x1={20} y1={12} x2={20} y2={6} />
        <line x1={9} y1={17} x2={5} y2={13} />
        <line x1={31} y1={17} x2={35} y2={13} />
      </svg>
    );
  }

  if (slot === "AFTERNOON") {
    return (
      <svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <circle cx={20} cy={20} r={8} />
        <line x1={20} y1={4} x2={20} y2={8} />
        <line x1={20} y1={32} x2={20} y2={36} />
        <line x1={4} y1={20} x2={8} y2={20} />
        <line x1={32} y1={20} x2={36} y2={20} />
        <line x1={9} y1={9} x2={12} y2={12} />
        <line x1={28} y1={28} x2={31} y2={31} />
        <line x1={9} y1={31} x2={12} y2={28} />
        <line x1={28} y1={12} x2={31} y2={9} />
      </svg>
    );
  }

  if (slot === "EVENING") {
    return (
      <svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <line x1={4} y1={20} x2={36} y2={20} />
        <path d="M12 20 a8 8 0 0 0 16 0" />
        <line x1={20} y1={6} x2={20} y2={14} />
        <polyline points="16 11 20 15 24 11" />
      </svg>
    );
  }

  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M26 8 A13 13 0 1 0 32 26 A14 14 0 0 1 26 8 Z" />
    </svg>
  );
}
