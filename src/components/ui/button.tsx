import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-forest text-white hover:bg-forest-deep active:scale-[0.99] shadow-sm",
  secondary: "border border-forest/25 bg-sage-soft text-forest hover:bg-sage/50 active:scale-[0.99]",
  danger: "bg-terracotta text-white hover:bg-terracotta-dark active:scale-[0.99] shadow-sm",
};

export function buttonClass({
  variant = "primary",
  className = "",
}: {
  variant?: Variant;
  className?: string;
} = {}) {
  return `inline-flex min-h-12 items-center justify-center rounded-full px-6 text-lg font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${className}`;
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
