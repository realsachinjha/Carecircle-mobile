import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  title,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_2px_12px_-4px_rgba(24,56,45,0.06)] ${className}`}
      {...props}
    >
      {title ? <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}
