import { strings } from "@/strings/en";

export type DocumentStatus = "PENDING" | "PARSING" | "PARSED" | "FAILED" | "VERIFIED";

const STYLE_BY_STATUS: Record<DocumentStatus, string> = {
  PENDING: "border-line text-muted",
  PARSING: "border-accent text-accent",
  PARSED: "border-warn text-warn",
  FAILED: "border-danger text-danger",
  VERIFIED: "border-ok text-ok",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-base font-medium ${STYLE_BY_STATUS[status]}`}
    >
      {strings.documents.statuses[status]}
    </span>
  );
}
