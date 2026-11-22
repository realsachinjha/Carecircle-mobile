import { strings } from "@/strings/en";

export type DocumentStatus = "PENDING" | "PARSING" | "PARSED" | "FAILED" | "VERIFIED";

const STYLE_BY_STATUS: Record<DocumentStatus, string> = {
  PENDING: "bg-surface border-line text-muted",
  PARSING: "bg-sage-soft border-forest/30 text-forest animate-pulse font-semibold",
  PARSED: "bg-peach border-terracotta/30 text-terracotta-dark font-bold",
  FAILED: "bg-peach-light border-danger/40 text-danger font-bold",
  VERIFIED: "bg-sage-soft border-forest/40 text-forest font-bold",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${STYLE_BY_STATUS[status]}`}
    >
      {status === "VERIFIED" && <span aria-hidden="true">✓</span>}
      <span>{strings.documents.statuses[status]}</span>
    </span>
  );
}
