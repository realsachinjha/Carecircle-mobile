import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldProps = { id: string; label: string; hint?: string; error?: string };

export function TextField({ id, label, hint, error, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-ink">{label}</label>
      <input
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className="min-h-12 rounded-xl border border-line bg-white px-3.5 text-lg text-ink transition-colors focus:border-forest focus:bg-white"
        {...props}
      />
      {hint ? <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p> : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}

export function TextArea({ id, label, hint, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-ink">{label}</label>
      <textarea
        id={id}
        name={id}
        rows={3}
        className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-lg text-ink transition-colors focus:border-forest"
        {...props}
      />
      {hint ? <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function SelectField({
  id,
  label,
  children,
  ...props
}: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-ink">{label}</label>
      <select
        id={id}
        name={id}
        className="min-h-12 rounded-xl border border-line bg-white px-3.5 text-lg text-ink transition-colors focus:border-forest"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
