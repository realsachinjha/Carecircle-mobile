import type { ReactNode } from "react";

const TONE_CLASSES = {
  info: "border-forest bg-sage-soft text-ink",
  success: "border-forest bg-sage-soft text-forest",
  warning: "border-terracotta bg-peach text-ink",
  error: "border-danger bg-peach-light text-danger",
} as const;

export function Notice({ tone = "info", children }: { tone?: keyof typeof TONE_CLASSES; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border-l-4 p-4 text-base ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
