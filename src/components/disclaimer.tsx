import { strings } from "@/strings/en";

export function Disclaimer({ variant = "full" }: { variant?: "full" | "footer" }) {
  return (
    <p role="note" className="text-xs text-muted leading-relaxed text-center sm:text-left">
      {variant === "footer" ? strings.footerDisclaimer : strings.disclaimer}
    </p>
  );
}
