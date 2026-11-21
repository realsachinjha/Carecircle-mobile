import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink",
  secondary: "border-2 border-accent bg-paper text-accent",
  danger: "bg-danger text-accent-ink",
};

export function buttonClass({
  variant = "primary",
  className = "",
}: {
  variant?: Variant;
  className?: string;
} = {}) {
  return `inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-semibold disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={buttonClass({ variant, className })}
    />
  );
}
